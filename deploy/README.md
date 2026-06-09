# Deploy / infrastructure — yours-truly

Infra-as-code for the EC2 box. These files describe the **target** SSR + API
setup; applying them is a deliberate, gated cutover (see below) because it
replaces the live static site and touches a production HTTPS domain.

| File | Installs to | Purpose |
| ---- | ----------- | ------- |
| `yt-api.service` | `/etc/systemd/system/yt-api.service` | Fastify API on `:4000` |
| `yt-web.service` | `/etc/systemd/system/yt-web.service` | `next start` SSR on `:3000` |
| `nginx-yours-truly.conf` | `/etc/nginx/sites-available/yours-truly` | `/`→web, `/api/`→API, HTTPS |
| `yt-deploy.sh` | `/usr/local/bin/yt-deploy.sh` | monorepo pull-based deploy |
| `api.env.example` | `/etc/yours-truly/api.env` (filled in) | API secrets (EnvironmentFile) |

## Prerequisites
- Postgres reachable at `DATABASE_URL` (local to start; **RDS before real users**).
- pnpm available on the deploy clone's PATH (corepack-activated `pnpm@9.12.0`).
- The monorepo code merged to `origin/main` (the deploy builds `origin/main`).

## Cutover (one-time) — takes the static site offline and brings up SSR + API

```bash
# 1. Secrets
sudo mkdir -p /etc/yours-truly
sudo cp deploy/api.env.example /etc/yours-truly/api.env
sudo sed -i "s/REPLACE_ME.*/$(openssl rand -hex 32)/" /etc/yours-truly/api.env
sudo $EDITOR /etc/yours-truly/api.env          # set real DATABASE_URL
sudo chmod 600 /etc/yours-truly/api.env

# 2. Let the deploy user restart services without a password
echo 'ubuntu ALL=(root) NOPASSWD: /usr/bin/systemctl restart yt-api yt-web, /usr/bin/systemctl restart yt-api, /usr/bin/systemctl restart yt-web' \
  | sudo tee /etc/sudoers.d/yt-deploy && sudo chmod 440 /etc/sudoers.d/yt-deploy

# 3. Install + start the services (from a freshly built deploy clone)
sudo cp deploy/yt-api.service deploy/yt-web.service /etc/systemd/system/
sudo cp deploy/yt-deploy.sh /usr/local/bin/yt-deploy.sh && sudo chmod +x /usr/local/bin/yt-deploy.sh
sudo systemctl daemon-reload
sudo systemctl enable --now yt-api yt-web
curl -fsS http://127.0.0.1:4000/api/health && echo OK     # verify API
curl -fsS -I http://127.0.0.1:3000/ | head -1             # verify web

# 4. Swap nginx ONLY after both services are healthy
sudo cp deploy/nginx-yours-truly.conf /etc/nginx/sites-available/yours-truly
sudo nginx -t && sudo systemctl reload nginx              # reload only if -t passes
```

## Rollback
- **nginx:** a timestamped backup of the previous static config exists in
  `/etc/nginx/sites-available/` (`yours-truly.bak-*`); `cp` it back and reload.
- **code:** `cd /home/ubuntu/deploy-src && git reset --hard <prev-sha> && /usr/local/bin/yt-deploy.sh`
- **services:** `sudo systemctl stop yt-web yt-api` (nginx will then 502 until
  restored — pair with the nginx rollback above).

## Notes
- The deploy timer (`yt-deploy.timer`, every 2 min) is reused as-is; only the
  script it runs changes. Confirm the timer is active after cutover:
  `systemctl is-active yt-deploy.timer`.
- `/home/ubuntu/deploy-src` is the build clone and the runtime CWD for the
  services — keep it distinct from any human checkout.
