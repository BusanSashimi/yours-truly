# Canonical-host cutover: apex → www (2026-06-12)

> Why this exists: Naver OAuth failed for flows started on `https://yourstruly.it`
> (apex). Root cause + the exact server-side steps applied are recorded here so
> the change is replayable on a host rebuild (companion to `deploy/REBUILD.md`).

## Root cause (verified live)

Better Auth cookies are **host-only** (no `Domain` attribute). The OAuth flow:

1. Page on the **apex** POSTs `/api/auth/sign-in/social` → state cookie
   `__Secure-better-auth.state` is set **scoped to `yourstruly.it`**.
2. Naver redirects the browser to the registered callback
   `https://www.yourstruly.it/api/auth/callback/naver` — the apex-scoped cookie
   is **not sent** (host-only ≠ subdomain).
3. Better Auth can't verify state → `302 /api/auth/error?error=state_mismatch`.

Flows started on **www** pass state verification (proven with curl cookie jars;
a bogus code then fails later at token exchange, as expected). The same
host-only scoping silently splits **sessions** between apex and www for
email/password users too — canonicalizing on one host fixes both.

Compounding factor at report time: the Naver-UI deploy (`f99c250`) was still
building when first tested, so prod had the dead CTA. And while the Naver app
is in 개발 중 status, only the owner / 멤버관리-registered tester IDs can
complete login at all (consent screen blocks others) until 검수 approval.

## Decision

Canonical host = **`www.yourstruly.it`** (matches `BETTER_AUTH_URL` and the
registered Naver callback). nginx 301s apex + bare IP → www, single hop, both
HTTP and HTTPS. The apex name **must stay on the TLS cert** — the HTTPS
redirect itself is served over TLS.

## Repo changes (this commit)

- `deploy/nginx-yours-truly.conf` — split into :80 (ACME carve-out → 301 www),
  :443 apex/bare-IP redirect block (own cert directives, `default_server`),
  :443 www app block.
- `deploy/yt-deploy.sh` — `DOMAIN=www.yourstruly.it`; the post-deploy smoke
  check requires exactly 200 and would hard-fail forever against a 301 apex.
- `deploy/api.env.example` — `CORS_ORIGIN=https://www.yourstruly.it,https://yourstruly.it`
  (canonical first; apex kept so stale cached pages keep working — the list
  feeds both Fastify CORS and Better Auth `trustedOrigins`).
- `deploy/REBUILD.md` — verification expects www=200 / apex=301.
- `apps/web` dashboard — display prefix now `www.yourstruly.it/invitations/`.

## Server-side steps (applied 2026-06-12 over SSH; replay on rebuild)

Ordering is load-bearing — the deploy timer must be frozen and the deploy
script updated **before** nginx starts 301ing the apex:

```bash
# 0. Freeze the pipeline; confirm no deploy is mid-flight
sudo systemctl stop yt-deploy.timer
pgrep -f yt-deploy.sh || echo idle

# 1. Install the updated deploy script atomically (never cp onto a
#    possibly-running script)
sudo install -m 755 /tmp/yt-deploy.sh /usr/local/bin/yt-deploy.sh.new
sudo mv /usr/local/bin/yt-deploy.sh.new /usr/local/bin/yt-deploy.sh

# 2. CORS/trustedOrigins: apex + www both trusted (order-independent w.r.t.
#    the nginx change), then restart the API
sudo sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://www.yourstruly.it,https://yourstruly.it|' /etc/yours-truly/api.env
sudo systemctl restart yt-api && curl -s http://127.0.0.1:4000/api/health

# 3. Install the new nginx site config, validate, reload
sudo cp /tmp/nginx-yours-truly.conf /etc/nginx/sites-available/yours-truly
sudo nginx -t && sudo systemctl reload nginx

# 4. Cert renewal was latently broken — found via `certbot renew --dry-run`
#    after the nginx split. NOT the authenticator (the lineage already used
#    webroot against /var/www/html): the apt certbot was 2.9.0 (2024) and
#    choked on 2026 ACME server behavior — log showed unrecognized
#    `dns-persist-01` challenge types and a finalize-while-authz-pending
#    failure (`orderNotReady`). Fix: migrate to the snap (current) client,
#    which also installs its own renewal timer (snap.certbot.renew.timer
#    replaces the apt certbot.timer removed with the package):
sudo snap install --classic certbot
sudo apt-get remove -y certbot python3-certbot python3-certbot-nginx  # keeps /etc/letsencrypt
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
# reload nginx when a real renewal lands (renewal conf [renewalparams]):
sudo sed -i '/^\[renewalparams\]/a renew_hook = systemctl reload nginx' \
  /etc/letsencrypt/renewal/yourstruly.it.conf
sudo certbot renew --dry-run   # → "all simulated renewals succeeded" (certbot 5.6.0)

# 5. Unfreeze; run one manual deploy to prove the new smoke check end-to-end
sudo systemctl start yt-deploy.timer
sudo systemctl start yt-deploy.service
```

## Verification checklist

- `curl -sI http://yourstruly.it/` → `301` with `Location: https://www.yourstruly.it/` (single hop)
- `curl -sI https://yourstruly.it/login` → `301` to `https://www.yourstruly.it/login`
- `curl -sI https://www.yourstruly.it/` → `200`
- `curl -s http://yourstruly.it/.well-known/acme-challenge/test` → `404` (served
  locally, **not** redirected — renewal path intact)
- `sudo certbot renew --dry-run` → all simulated renewals succeed (validates
  both names through the new config; also exercises the snap client)
- `systemctl list-timers | grep certbot` → `snap.certbot.renew.timer` armed
- www OAuth probe: POST `sign-in/social` from a www origin → 200 + authorize
  URL; callback with the state cookie present passes state verification
- `journalctl -u yt-deploy -n 20` → `DEPLOY OK` with the www smoke check

## Notes & accepted consequences

- **One-time forced logout**: sessions whose cookies were set on the apex are
  invisible on www; users sign in again. Accepted (effectively zero real users).
- Open apex tabs at cutover break until reload (their `/api` fetches hit the
  301). Accepted, same reason.
- **301s are cached aggressively by browsers** — reversing canonicalization
  later would fight cached redirects. Treat www-as-canonical as permanent.
- Already-shared apex invitation links keep working via the 301 (scrapers and
  browsers follow it); guests pay one extra hop.
