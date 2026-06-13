#!/usr/bin/env bash
# yt-deploy.sh — pull-based auto-deploy for "yours-truly" (pnpm monorepo:
# Next.js SSR web + Fastify API + Postgres). Install as /usr/local/bin/yt-deploy.sh.
#
# Builds origin/main in the dedicated clone (/opt/yours-truly, owned by ytapp —
# run this script as ytapp), runs DB migrations, restarts the long-running
# services, and verifies both tiers with a smoke check before recording the
# deployed SHA. SHA-gated (no-ops when unchanged), single-flight (flock), and
# CI-gated: a commit is only deployed once its GitHub Actions checks are green.
#
# NOTE: unlike the previous static-export deploy, the running services execute
# directly from the build clone (a Node server can't be swapped by an atomic
# symlink the way static files can). Rollback is therefore git-based — revert on
# origin/main and let the pipeline ship it (a local reset would be undone by the
# next timer tick):
#   git revert <bad-sha>, then merge the revert PR   # CI runs, this script deploys it
set -Euo pipefail

REPO=/opt/yours-truly
REPO_SLUG=BusanSashimi/yours-truly
MARKER=/var/www/yours-truly/.deployed_sha
LOCKFILE=/tmp/yt-deploy.lock
# Canonical host — the apex 301s to www (see nginx conf), and the smoke check
# below requires exactly 200, so it must target the host that serves the app.
DOMAIN=www.yourstruly.it
ENV_FILE=/etc/yours-truly/api.env

export PATH="/usr/local/bin:/usr/bin:$PATH"
log() { echo "[$(date '+%F %T')] $*"; }

# Single-flight: never let two deploys overlap.
exec 9>"$LOCKFILE"
if ! flock -n 9; then log "another deploy in progress; exiting"; exit 0; fi

cd "$REPO"
git fetch --quiet origin main
NEW_SHA="$(git rev-parse origin/main)"
CUR_SHA="$(cat "$MARKER" 2>/dev/null || echo none)"

if [ "$NEW_SHA" = "$CUR_SHA" ]; then
  log "up to date at ${NEW_SHA:0:7}; nothing to deploy"
  exit 0
fi

# CI gate: deploy only commits whose GitHub Actions checks all completed
# successfully. Unauthenticated API is fine (public repo), and it is only
# consulted when origin/main actually moved, so rate limits are a non-issue.
if ! CHECKS="$(curl -fsS --max-time 15 -H 'Accept: application/vnd.github+json' \
      "https://api.github.com/repos/$REPO_SLUG/commits/$NEW_SHA/check-runs?per_page=100")"; then
  log "GitHub checks API unreachable; retrying next run"; exit 0
fi
TOTAL="$(jq -r '.total_count' <<<"$CHECKS")"
PENDING="$(jq -r '[.check_runs[] | select(.status != "completed")] | length' <<<"$CHECKS")"
BAD="$(jq -r '[.check_runs[] | select(.status == "completed"
        and .conclusion != "success" and .conclusion != "skipped"
        and .conclusion != "neutral")] | length' <<<"$CHECKS")"
if [ "$TOTAL" -eq 0 ] || [ "$PENDING" -gt 0 ]; then
  log "CI not finished for ${NEW_SHA:0:7} ($TOTAL checks, $PENDING pending); retrying next run"
  exit 0
fi
if [ "$BAD" -gt 0 ]; then
  log "CI FAILED for ${NEW_SHA:0:7} ($BAD failing check(s)); REFUSING to deploy — fix or revert main"
  exit 1
fi

log "change detected: ${CUR_SHA:0:7} -> ${NEW_SHA:0:7}, CI green ($TOTAL checks); building"
git reset --hard --quiet origin/main

# Build (a failure here never touches the running services).
if ! pnpm install --frozen-lockfile; then
  log "pnpm install FAILED; aborting (live site untouched)"; exit 1
fi
if ! pnpm --filter @yours-truly/shared build; then
  log "shared build FAILED; aborting"; exit 1
fi
if ! pnpm --filter @yours-truly/api build; then
  log "api build FAILED; aborting"; exit 1
fi
if ! pnpm --filter @yours-truly/web build; then
  log "web build FAILED; aborting"; exit 1
fi

# DB migrations — read DATABASE_URL from the same env file the API service uses.
set -a; . "$ENV_FILE"; set +a
if ! pnpm --filter @yours-truly/api db:migrate; then
  log "db migrate FAILED; aborting (services not restarted)"; exit 1
fi

# Restart the long-running services (requires the sudoers rule in deploy/README.md).
sudo systemctl restart yt-api yt-web
sleep 3

# Smoke-check both tiers: API directly, web through nginx over HTTPS.
API_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:4000/api/health || echo 000)"
WEB_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
            --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" || echo 000)"
if [ "$API_CODE" != "200" ] || [ "$WEB_CODE" != "200" ]; then
  log "SMOKE CHECK FAILED (api $API_CODE, web $WEB_CODE); investigate (deploy NOT recorded)"
  exit 1
fi

echo "$NEW_SHA" > "$MARKER"
log "DEPLOY OK at ${NEW_SHA:0:7} (api $API_CODE, web $WEB_CODE)"
exit 0
