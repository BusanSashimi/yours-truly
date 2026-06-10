#!/usr/bin/env bash
# yt-deploy.sh — pull-based auto-deploy for "yours-truly" (pnpm monorepo:
# Next.js SSR web + Fastify API + Postgres). Install as /usr/local/bin/yt-deploy.sh.
#
# Builds origin/main in the dedicated clone (/home/ubuntu/deploy-src), runs DB
# migrations, restarts the long-running services, and verifies both tiers with a
# smoke check before recording the deployed SHA. SHA-gated (no-ops when unchanged)
# and single-flight (flock).
#
# NOTE: unlike the previous static-export deploy, the running services execute
# directly from the build clone (a Node server can't be swapped by an atomic
# symlink the way static files can). Rollback is therefore git-based:
#   cd /opt/yours-truly && git reset --hard <prev-sha> && /usr/local/bin/yt-deploy.sh
set -Euo pipefail

REPO=/opt/yours-truly
MARKER=/var/www/yours-truly/.deployed_sha
LOCKFILE=/tmp/yt-deploy.lock
DOMAIN=yourstruly.it
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

log "change detected: ${CUR_SHA:0:7} -> ${NEW_SHA:0:7}; building"
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
