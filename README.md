# yours-truly

Wedding invitation maker and host. Couples design a mobile invitation page,
pick a name for it, and share the public URL with their guests:

```
https://www.yourstruly.it/invitations/<slug>
```

## Repo layout (pnpm workspaces)

```
apps/
  web/        Next.js 15 (SSR/ISR) — marketing site + guest-facing invitation pages
  api/        Fastify 5 — auth (Better Auth), invitation CRUD, Postgres via Drizzle
packages/
  shared/     zod contracts shared by both apps (slug rules, invitation schemas)
deploy/       production infra (EC2 + nginx + systemd, pull-based CI-gated deploy)
docs/         architecture decisions & runbooks — start with docs/architecture.md
scripts/      local dev tooling (bootstrap, compose init)
```

## Local development

Prerequisites: Node ≥ 20 (`corepack enable` for pnpm) and Docker.

```bash
pnpm bootstrap   # one-time: postgres:16 via compose, apps/api/.env with a
                 # generated secret, install, migrate, seed demo data
pnpm dev         # web on :3000, api on :4000 (starts the db container if needed)
```

Then open <http://localhost:3000/invitations/demo-wedding> — a seeded,
published demo invitation (owner login: `demo@example.com` / `demo-password-1`).

The database runs in Docker (`compose.yaml`, postgres:16 — same major version
as production RDS and CI). The apps run natively for fast reload. Data persists
in a named volume; `docker compose down -v` resets it (re-run `pnpm bootstrap`).

### Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | both apps in watch mode (`dev:web` / `dev:api` for one) |
| `pnpm build` | build shared, then both apps |
| `pnpm lint` / `pnpm typecheck` | repo-wide |
| `pnpm --filter @yours-truly/api test` | API tests against `yours_truly_test` (created by compose init) |
| `pnpm --filter @yours-truly/shared test` | shared contract tests |
| `pnpm db:generate` | new drizzle migration from schema changes |
| `pnpm db:migrate` | apply migrations (reads `DATABASE_URL` from env) |
| `pnpm db:seed` | (re-)seed demo data — idempotent |

## Production

Single EC2 box behind nginx (TLS), web + api as systemd services, Postgres on
RDS. Deploys are pull-based and CI-gated: push to `main`, GitHub Actions must
go green, then the box's timer builds, migrates, restarts, and smoke-checks.
Details and runbooks: `deploy/README.md` and `docs/architecture.md`.
