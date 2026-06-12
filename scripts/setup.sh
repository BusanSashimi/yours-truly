#!/usr/bin/env bash
# One-time local setup: clone → running dev environment ("scripts to rule them
# all" pattern). Idempotent — safe to re-run; it never overwrites an existing
# apps/api/.env. Run via `pnpm bootstrap`.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v docker >/dev/null 2>&1 || {
  echo "error: Docker is required (https://docs.docker.com/get-docker/)"; exit 1; }
command -v pnpm >/dev/null 2>&1 || {
  echo "error: pnpm is required — run: corepack enable"; exit 1; }

echo "▸ starting postgres:16 (docker compose)"
docker compose up -d --wait

ENV_FILE=apps/api/.env
if [ ! -f "$ENV_FILE" ]; then
  echo "▸ creating $ENV_FILE with a generated secret"
  cat > "$ENV_FILE" <<EOF
# Local development env for the API (gitignored). Created by scripts/setup.sh.
# Matches the compose.yaml postgres service.
DATABASE_URL=postgres://yt:ytpass@localhost:5432/yours_truly
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
# Naver OAuth — optional locally; when unset only email/password is enabled.
# To test the full flow locally, ALSO set BETTER_AUTH_URL=http://localhost:3000
# (the browser must return through the web app's /api rewrite, not :4000) and
# register http://localhost:3000/api/auth/callback/naver in the Naver console.
#BETTER_AUTH_URL=http://localhost:3000
#NAVER_CLIENT_ID=
#NAVER_CLIENT_SECRET=
EOF
else
  echo "▸ $ENV_FILE already exists — leaving it untouched"
fi

echo "▸ installing dependencies"
pnpm install

echo "▸ running database migrations (dev + test databases)"
# drizzle-kit reads process env, not the API's .env file — source it here.
set -a; . "$ENV_FILE"; set +a
pnpm db:migrate
# Keep the test DB schema current too, so `pnpm --filter @yours-truly/api test`
# works immediately (CI migrates it the same way before testing).
DATABASE_URL=postgres://yt:ytpass@localhost:5432/yours_truly_test pnpm db:migrate

echo "▸ seeding demo data"
pnpm db:seed

echo
echo "✓ setup complete"
echo "  pnpm dev   → web http://localhost:3000 · api http://localhost:4000"
echo "  demo page  → http://localhost:3000/invitations/demo-wedding"
