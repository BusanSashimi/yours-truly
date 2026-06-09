# Architecture & Roadmap — yours-truly

> Status: **planning + initial scaffold** · Last updated 2026-06-09
>
> This document captures the analysis and decisions behind moving `yours-truly`
> from a static-export Next.js boilerplate to a full-stack app (SSR frontend +
> Node/TS API + auth + database), and the scaling path beyond the first server.

---

## 1. Where we started

The repo was the default `create-next-app` output with one change:

- **Next.js 15 / React 19 RC**, `next.config.ts` set to `output: 'export'` → a
  **purely static site** (SSG only; no SSR, no API routes, no server runtime).
- Served by **nginx + Let's Encrypt HTTPS** on a single **EC2** box.
- **Pull-based systemd auto-deploy**: `yt-deploy.timer` → `yt-deploy.sh` pulls
  `origin/main`, builds, writes a timestamped release dir under
  `/var/www/yours-truly/releases/`, and flips a `current` symlink. Health-checked
  via HTTPS 200 after each flip.
- Content was just the boilerplate landing page.

The deploy pipeline is clean and worth keeping; the *static-only* constraint is
what we're outgrowing.

## 2. Requirements that drove the design

Confirmed with the project owner:

| Decision            | Choice                                                        |
| ------------------- | ------------------------------------------------------------- |
| Backend purpose     | User accounts + auth, REST/JSON API, persistent data storage  |
| Backend stack       | **Separate Node/TS service** (not Next Route Handlers)        |
| Frontend rendering  | **Switch to SSR/ISR** (drop static export)                    |
| Hosting             | Advisory for now — **stay on EC2**, plan a cloud-native path  |

Because we need accounts + a dynamic API + stored data, a running server is
required either way — which is what justifies leaving static export and
co-locating a backend.

## 3. Target architecture (current phase)

```
                         ┌─────────────── EC2 box ───────────────┐
                         │                                        │
  Browser ──HTTPS──▶ nginx (TLS, Let's Encrypt)                   │
                         │   /          → :3000  next start (SSR) │
                         │   /api/*      → :4000  Fastify API      │
                         │                          │             │
                         │                          ▼             │
                         │                    Postgres (local to  │
                         │                     start → RDS later) │
                         └────────────────────────────────────────┘
```

Two long-running Node processes under **systemd** (mirrors the existing
`yt-deploy` pattern). nginx is the single TLS terminator and router:
`/` → web (3000), `/api/*` → api (4000).

### Repo layout — monorepo (pnpm workspaces)

Both sides are TypeScript, so the biggest win is sharing types and validation
schemas across the wire.

```
apps/
  web/              Next.js (SSR/ISR) — formerly the repo root
  api/              Fastify service (auth + REST API)
packages/
  shared/           zod schemas + inferred types used by both apps
pnpm-workspace.yaml
package.json        root (workspace scripts, dev tooling)
```

Use **pnpm workspaces** (lightest). Move to **Turborepo** only if build caching
becomes a bottleneck.

## 4. Component choices (pick → alternative, with rationale)

| Concern        | Pick                          | Alternative      | Why the pick                                                                 |
| -------------- | ----------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| Backend HTTP   | **Fastify**                   | NestJS           | Fast, first-class TS, pairs with zod for validation; minimal ceremony.       |
| ORM            | **Drizzle**                   | Prisma           | TS-native, lightweight, SQL-transparent, no codegen daemon.                  |
| Database       | **Postgres**                  | —                | Relational data + accounts; SQLite ruled out for a dynamic multi-user API.   |
| Auth           | **Cookie sessions in the API**| Hand-rolled JWT  | Single source of truth in the authoritative backend; SSR reads cookie direct.|
| Auth library   | **Hand-rolled (scrypt + signed cookie sessions)** | Better Auth      | See note below — chosen for zero native deps / schema ownership.             |
| Monorepo tool  | **pnpm workspaces**           | Turborepo        | Lightest; add caching later only if needed.                                  |

Notes:
- **Keep auth in the API**, not split across both apps — one authoritative
  source. SSR pages read the httpOnly session cookie server-side.
- **Auth implementation (step 4, done):** the doc originally named *Better Auth*,
  but it wants to own its own schema (CLI-generated `user`/`session`/`account`/
  `verification` tables) and bundles OAuth/email-verification we don't need yet.
  That conflicted with the hand-designed Drizzle schema and added setup friction,
  so we implemented the doc's real intent — *cookie sessions, authoritative in the
  API* — directly: Node built-in `scrypt` for password hashing (no native deps),
  opaque 32-byte session tokens stored in the `sessions` table, set as a **signed,
  httpOnly, SameSite=Lax** cookie (`Secure` in production). Endpoints:
  `POST /api/auth/{register,login,logout}`, `GET /api/auth/me`. Login uses a
  constant-message 401 to avoid account enumeration. Revisit Better Auth if/when
  OAuth providers or email verification are needed.
- **Validation:** zod schemas live in `packages/shared` and are imported by both
  the API (request/response validation) and the web app (form types), so the
  contract can't drift.

## 5. Security baseline (required before any real users)

- **Secrets** outside the release dir — use **SSM Parameter Store** or an env
  file mounted by systemd; never commit `.env*`.
- **Session cookies**: `httpOnly`, `Secure`, `SameSite=Lax`.
- **Postgres not publicly exposed** — bind to localhost (local) or a private
  subnet / security group (RDS).
- HTTPS already in place via Let's Encrypt — keep auto-renewal healthy.
- **Known issue (2026-06-09):** the `origin` git remote URL contains a plaintext
  GitHub PAT (`ghp_...`). Rotate the token and rewrite the remote to use SSH or a
  credential helper. Treat the leaked token as compromised.

## 6. Deployment evolution

Extend the existing release-based pipeline rather than replace it:

1. `yt-deploy.sh` builds **both** apps (`pnpm --filter web build`,
   `pnpm --filter api build`) into the timestamped release dir.
2. After flipping the `current` symlink, `systemctl restart yt-web yt-api`
   (instead of only swapping static files).
3. Run DB migrations (`drizzle-kit migrate`) as a gated step before restart.
4. Keep the post-flip HTTPS 200 health check; add an API healthcheck
   (`GET /api/health`).

systemd units to add: `yt-web.service` (`next start -p 3000`) and
`yt-api.service` (`node apps/api/dist/server.js`), both `WantedBy` the deploy.

## 7. Scaling path (when to move, and to what)

Ordered by when it tends to matter — don't pre-build these.

1. **Now — single EC2 + local Postgres.** Cheapest, full control, maximal
   continuity with the existing pipeline. Single point of failure; manual scaling.
2. ~~**Before launch — move DB to RDS Postgres.**~~ **Done (2026-06-09):**
   `yt-prod`, db.t4g.small single-AZ, private, SSL-required. Managed backups +
   point-in-time restore. Multi-AZ failover is the next upgrade when needed.
3. **Traffic grows — separate web/api onto their own instances** behind an
   **ALB**; add an autoscaling group for the stateless tiers.
4. **Resilience / spiky load — containerize (Docker) → ECS Fargate.** No servers
   to patch, rolling deploys, autoscaling. API and web as separate services.
5. **Cloud-native frontend — OpenNext/SST** (Next SSR on Lambda + CloudFront),
   API on Fargate or Lambda + API Gateway, **Aurora Serverless** for data. Most
   resilient and auto-scaling; most AWS-specific complexity. Adopt only when
   uptime/scale requirements justify it.

Caching/CDN layer (CloudFront in front of nginx, or static assets to S3) can be
slotted in at any stage once traffic warrants it.

## 8. Migration steps (this phase)

1. Restructure into the pnpm monorepo (`apps/web`, `apps/api`, `packages/shared`).
2. Drop `output: 'export'`; the web app now runs via `next start` (SSR/ISR).
3. Scaffold Fastify + Drizzle + Postgres; add `packages/shared` zod contracts.
4. ~~Add auth with cookie sessions + a `users` table.~~ **Done** — scrypt
   password hashing + signed httpOnly session cookies; register/login/logout/me
   verified end-to-end against a live Postgres.
5. **Done — applied to the EC2 box (2026-06-09).** systemd units (`yt-web` :3000,
   `yt-api` :4000) run from the deploy clone; nginx proxies `/`→web, `/api/`→API
   over HTTPS; `yt-deploy.sh` builds both apps, runs migrations, restarts services,
   and smoke-checks both tiers; secrets live in `/etc/yours-truly/api.env`
   (root:ubuntu 640). Infra-as-code + runbook in `deploy/`.
6. **DB on RDS (2026-06-09).** `yt-prod` — `db.t4g.small`, Postgres 16.14,
   single-AZ, 20GB gp3, 7-day backups, **private** (SG `yt-rds-sg` allows 5432
   only from the app EC2's SG; not publicly accessible). The app connects with
   `?sslmode=require` (RDS rejects unencrypted). Local Postgres has been stopped
   and disabled. **Hardening TODO:** upgrade `require` → `verify-full` with the
   RDS CA bundle; consider Multi-AZ when uptime demands it.

### Local dev quick-start

```bash
# one-time: local Postgres (Ubuntu)
sudo apt-get install -y postgresql
sudo -u postgres psql -c "CREATE ROLE yt LOGIN PASSWORD 'ytpass';" \
                      -c "CREATE DATABASE yours_truly OWNER yt;"

cp apps/api/.env.example apps/api/.env   # then edit DATABASE_URL / SESSION_SECRET
pnpm install
pnpm db:migrate                          # apply drizzle migrations
pnpm dev                                 # web :3000, api :4000 in parallel
```

**Running the API tests** (one-time: create + migrate a separate test DB):

```bash
sudo -u postgres psql -c "CREATE DATABASE yours_truly_test OWNER yt;"
DATABASE_URL=postgres://yt:ytpass@localhost:5432/yours_truly_test \
  pnpm --filter @yours-truly/api db:migrate

pnpm --filter @yours-truly/api test
```

The suite (`apps/api/src/routes/auth.test.ts`) uses Node's built-in test runner
+ Fastify `app.inject()` (no listening socket) and truncates tables between
tests for isolation. It covers register / login / logout / me incl. the failure
paths (bad input, duplicate email, wrong password, unauthenticated).

Steps 1–4 are complete; step 5 (deploy/systemd/nginx + secrets) is next.
