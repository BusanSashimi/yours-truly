# Cutover — manual steps (your actions)

These are the steps **only you can do** to finish bringing up the rebuilt host
`i-08c6c815be484c2e5`. Claude has no SSM access and can't rotate RDS, so these two
unblock everything else. Once they're done, Claude finishes the rest over SSH.

Context: the new box is built and healthy; the Elastic IP `44.197.95.242` already
points at it; port 22 is open to your IP only. What remains is on-box config that
needs a DB password and an SSH key seeded.

---

## Step 1 — Seed your SSH key (console Session Manager)

Console → **EC2 → Instances → `i-08c6c815be484c2e5` → Connect → Session Manager → Connect**.
In that browser shell, paste:

```bash
sudo install -d -m 700 -o ubuntu -g ubuntu /home/ubuntu/.ssh
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFbNqIufMj0Fm3yDEPGJFpfFXtH1cpAMsILD1BanqDU5Snry/urjzuQV/omhHjEp7Uiir41Ia2ElpnuwaK2GYs3a4AC5BeLa9E/He6qFPKQEU3BLDVO1XP/0bmAVss7I9wdylGQA93hNtZ/hYR6Ak4ypIWD+2sXtmE/hSFkQzI6pUVFPPr1FSEX3JKGC1rRctUHesGYZM4VjziXuSoCcIkNvZL5y60uy3/t5/bfmq9UtgVg+Kj/F7dDabTurCoidXzqTO4oZz6/lngOguWtEBwjsw5Zo+vd93zZ+f/XW3z459MdcuPgpvMz7zvYXgcF0Q2JqpgN0ZjJf2tokZ4W/0n yours-truly-mac-book' | sudo tee -a /home/ubuntu/.ssh/authorized_keys
sudo chmod 600 /home/ubuntu/.ssh/authorized_keys && sudo chown ubuntu:ubuntu /home/ubuntu/.ssh/authorized_keys
```

(This is the public key derived from your existing `yours-truly-mac-book.pem` — no new keypair.)

## Step 2 — Rotate the RDS password (console)

Console → **RDS → Databases → `yt-prod` → Modify**:
- **New master password** — use **letters + digits only** (avoids URL-encoding issues).
- Continue → **Apply immediately** → **Modify DB instance**.
- Wait for status to return to **Available**.

Then **paste that password to Claude.** With the key seeded (Step 1) and this
password in hand, Claude does the rest over SSH.

---

## What Claude does next (no action from you — listed for reference)

Over `ssh -i yours-truly-mac-book.pem ubuntu@44.197.95.242`:

```bash
# write API env (root-owned, group-readable by ytapp)
sudo tee /etc/yours-truly/api.env >/dev/null <<EOF
DATABASE_URL=postgres://yt:<YOUR_NEW_RDS_PW>@yt-prod.cmn608iignnq.us-east-1.rds.amazonaws.com:5432/yours_truly
DATABASE_CA=/etc/yours-truly/rds-ca.pem
PORT=4000
CORS_ORIGIN=https://yourstruly.it
SESSION_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
EOF
sudo chown root:ytapp /etc/yours-truly/api.env && sudo chmod 640 /etc/yours-truly/api.env

# migrate, start services, verify locally
cd /opt/yours-truly && set -a; . /etc/yours-truly/api.env; set +a
pnpm --filter @yours-truly/api db:migrate
sudo systemctl start yt-api yt-web && sleep 3
curl -s localhost:4000/api/health; curl -sI localhost:3000 | head -1

# TLS (EIP already points here): free :80, issue cert, bring nginx up
sudo systemctl stop nginx 2>/dev/null
sudo certbot certonly --standalone -d yourstruly.it -d www.yourstruly.it --non-interactive --agree-tos -m <you@domain>
sudo systemctl start nginx
```

Then Claude verifies `https://yourstruly.it` + `/api/health` and **terminates** the
old box `i-011a7e6377f9f0d18` (snapshot `snap-0ce2c80ac0e98ae88` preserved).

## Also yours, anytime

- **Revoke the leaked GitHub PAT** — GitHub → Settings → Developer settings →
  Personal access tokens. The repo is public and the new host clones over HTTPS
  with no token, so nothing depends on it.

---

### If SSH later fails
- `Permission denied (publickey)` → Step 1 didn't land; re-run it.
- Connection times out → your public IP changed (currently allowed: `1.227.122.254/32`);
  tell Claude the new IP to update the security-group rule.
