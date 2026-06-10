# Deploy / infrastructure — yours-truly

Infra-as-code for the production EC2 box (`yt-prod-2`). The cutover to the
SSR + API setup is done; this directory is now the reference for what is
installed and how changes reach production.

## Pipeline

```
git push → GitHub Actions CI (.github/workflows/ci.yml)
         → yt-deploy.timer on the box (every 5 min, as ytapp)
         → yt-deploy.sh: fetch origin/main → no-op if SHA unchanged
           → refuse unless CI is green for that SHA
           → build → migrate → restart yt-api/yt-web → smoke check → record SHA
```

Pull-based on purpose: the box holds **no** GitHub credentials, no runner, and
needs no inbound access for deploys — it anonymously polls a public repo over
HTTPS. This is part of the post-incident posture (see
`docs/security-incident-2026-06-09.md`).

| File | Installs to | Purpose |
| ---- | ----------- | ------- |
| `yt-api.service` | `/etc/systemd/system/yt-api.service` | Fastify API on `127.0.0.1:4000` |
| `yt-web.service` | `/etc/systemd/system/yt-web.service` | `next start` SSR on `127.0.0.1:3000` |
| `yt-deploy.service` | `/etc/systemd/system/yt-deploy.service` | oneshot deploy run (as `ytapp`) |
| `yt-deploy.timer` | `/etc/systemd/system/yt-deploy.timer` | drives yt-deploy every 5 min |
| `nginx-yours-truly.conf` | `/etc/nginx/sites-available/yours-truly` | `/`→web, `/api/`→API, HTTPS |
| `yt-deploy.sh` | `/usr/local/bin/yt-deploy.sh` | CI-gated pull deploy |
| `api.env.example` | `/etc/yours-truly/api.env` (filled in) | API secrets (EnvironmentFile) |

## Host prerequisites (already true on yt-prod-2)

- Deploy clone `/opt/yours-truly` owned by `ytapp` (nologin service user);
  `ytapp`'s HOME is the clone, so pnpm has a writable store.
- `pnpm@9.12.0` (corepack-activated), `node >= 20`, `jq`, `curl` on PATH.
- Secrets in `/etc/yours-truly/api.env` (`root:ytapp` 640).
- Sudoers (`/etc/sudoers.d/yt-deploy`) lets `ytapp` run exactly
  `systemctl restart yt-api yt-web` (and each individually) — nothing else.

## Installing / updating the deploy machinery

```bash
sudo cp deploy/yt-deploy.sh /usr/local/bin/yt-deploy.sh && sudo chmod +x /usr/local/bin/yt-deploy.sh
sudo cp deploy/yt-deploy.service deploy/yt-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now yt-deploy.timer
systemctl list-timers yt-deploy.timer       # confirm scheduled
sudo systemctl start yt-deploy.service      # optional: run one deploy now
journalctl -u yt-deploy.service -n 50       # deploy logs
```

## Rollback

- **code:** `git revert <bad-sha> && git push` — CI runs, the box deploys the
  revert within ~5 minutes. Do NOT `git reset` the deploy clone by hand; the
  next timer tick resets it to origin/main anyway.
- **freeze deploys:** `sudo systemctl stop yt-deploy.timer` (re-enable with
  `start`). Useful while investigating before rolling back.
- **services:** `sudo systemctl stop yt-web yt-api` takes the site down hard
  (nginx will 502) — last resort.

## Notes

- Every new commit on main redeploys (build + service restart), including
  docs-only commits. Restarts take a few seconds behind nginx; acceptable for
  now — add a path filter to the script if it ever isn't.
- A red CI on main halts deploys entirely (`yt-deploy.service` exits failed and
  logs `REFUSING to deploy`) until main is fixed or reverted.
- CI checks are matched by commit SHA via the public checks API; the required
  context is the `ci` job in `.github/workflows/ci.yml`.
