#!/usr/bin/env bash
# bootstrap.sh — EC2 user-data for a CLEAN yours-truly host (Ubuntu 24.04).
# Paste as "User data" when launching the replacement instance; runs as root on
# first boot. Provisions the base host and a build only — it deliberately does
# NOT write secrets, NOT obtain a TLS cert, and NOT start the app services
# (those are the post-launch steps in deploy/REBUILD.md, since they depend on
# rotated secrets and DNS/EIP pointing at this box).
#
# Hardening vs. the compromised host (see docs/security-incident-2026-06-09.md):
#   - services run as the unprivileged, no-login user `ytapp` (NOT `ubuntu`);
#   - `ytapp` has NO sudo except restarting its own two units;
#   - app ports 3000/4000 stay on localhost behind nginx (SG exposes only 80/443).
set -euxo pipefail

REPO_URL=https://github.com/BusanSashimi/yours-truly.git
APP_DIR=/opt/yours-truly
SVC_USER=ytapp

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates nginx certbot python3-certbot-nginx

# Node 22 system-wide (/usr/bin/node) + pnpm via corepack — no per-user nvm.
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
corepack enable
corepack prepare pnpm@9.12.0 --activate

# Dedicated unprivileged service account; owns the deploy clone under /opt.
id "$SVC_USER" >/dev/null 2>&1 || useradd --system --shell /usr/sbin/nologin --home-dir "$APP_DIR" "$SVC_USER"
git clone "$REPO_URL" "$APP_DIR"
chown -R "$SVC_USER:$SVC_USER" "$APP_DIR"

# Build the monorepo as the service user (a build failure must not run as root).
sudo -u "$SVC_USER" bash -lc "cd $APP_DIR && pnpm install --frozen-lockfile \
  && pnpm --filter @yours-truly/shared build \
  && pnpm --filter @yours-truly/api build \
  && pnpm --filter @yours-truly/web build"

# Runtime dirs: api.env (root-owned, group-readable by ytapp) + deploy marker + acme webroot.
install -d -m 750 -o root -g "$SVC_USER" /etc/yours-truly
install -d -m 755 -o "$SVC_USER" -g "$SVC_USER" /var/www/yours-truly
install -d -m 755 /var/www/html

# RDS CA bundle for the app's verify-full TLS to Postgres (DATABASE_CA points here).
curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /etc/yours-truly/rds-ca.pem
chown root:"$SVC_USER" /etc/yours-truly/rds-ca.pem
chmod 640 /etc/yours-truly/rds-ca.pem

# systemd units, nginx site, deploy script.
install -m 644 "$APP_DIR/deploy/yt-api.service" /etc/systemd/system/yt-api.service
install -m 644 "$APP_DIR/deploy/yt-web.service" /etc/systemd/system/yt-web.service
install -m 755 "$APP_DIR/deploy/yt-deploy.sh"   /usr/local/bin/yt-deploy.sh
install -m 644 "$APP_DIR/deploy/nginx-yours-truly.conf" /etc/nginx/sites-available/yours-truly
ln -sf /etc/nginx/sites-available/yours-truly /etc/nginx/sites-enabled/yours-truly
rm -f /etc/nginx/sites-enabled/default

# Minimal sudoers: ytapp may ONLY restart its own services (for yt-deploy.sh).
# This is the ONE privilege it has — no blanket NOPASSWD:ALL like the old `ubuntu`.
cat >/etc/sudoers.d/yt-deploy <<EOF
$SVC_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart yt-api yt-web, /usr/bin/systemctl restart yt-api, /usr/bin/systemctl restart yt-web
EOF
chmod 440 /etc/sudoers.d/yt-deploy
visudo -cf /etc/sudoers.d/yt-deploy

systemctl daemon-reload
# nginx will fail to (re)load until the TLS cert exists — that's expected; the
# cert is issued in the post-launch runbook once the EIP points here. Enable only.
systemctl enable yt-api yt-web nginx

echo "bootstrap complete — base host + build ready. Continue with deploy/REBUILD.md."
