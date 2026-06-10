# Security Incident Report — Cryptominer Compromise

> **Note:** This file was originally authored on the compromised host and never
> committed; it survived only in EBS snapshot `snap-0ce2c80ac0e98ae88`. This is a
> faithful **reconstruction** from the investigation + reassessment records
> (2026-06-09 and 2026-06-10 sessions), not a byte-exact recovery. For the verbatim
> original, mount the snapshot read-only on a forensic instance.

- **Date of incident:** 2026-06-09 (~17:55 UTC)
- **Detected:** 2026-06-10 (~00:16 UTC), during investigation of unexplained memory pressure
- **Affected host:** EC2 `i-011a7e6377f9f0d18` (`yt-prod` app server), us-east-1, VPC `vpc-0b4772cbfd90b23ef`
- **Severity:** High — full root compromise of the application host
- **Status:** **Resolved** — host terminated; replaced by a clean, hardened host (`i-08c6c815be484c2e5`) on 2026-06-10
- **Data impact:** None — the RDS database was empty; RDS itself was not breached

> ⚠️ The host was considered **fully compromised and untrustworthy**. It was
> contained, then (after containment failed) stopped and terminated; the volume is
> preserved as snapshot `snap-0ce2c80ac0e98ae88`.

## 1. Timeline (UTC)

| Time | Event |
| --- | --- |
| 2026-06-09 ~07:04 | Host boot (normal). |
| 2026-06-09 09:13–09:24 | Legitimate deploy work — migrate to RDS Postgres + verify-full TLS (commits `59fe31b`, `8a628dd`). |
| 2026-06-09 **17:55:08** | `sudo ubuntu→root: /usr/bin/mount -o remount,rw /` from PWD `/home/ubuntu/deploy-src/apps/web`. |
| 2026-06-09 **17:55:10** | `sudo ubuntu→root: ./rondo react.x86_64` from `/run/user/1000/lib` — miner installed/run as root. |
| 2026-06-10 ~00:16 | Detected during investigation of memory pressure / OOM. |
| 2026-06-10 ~00:30 | Initial containment (miner killed, huge pages reclaimed). |
| 2026-06-10 ~01:55 | **Containment failed** — miner relaunched (no reboot); root watchdog re-drops the kit hourly. |
| 2026-06-10 ~02:36 | Host **stopped**. |
| 2026-06-10 ~05:1x | Clean host verified live; compromised host **terminated**. |

## 2. What it was

- **Malware:** XMRig / RandomX **Monero miner**. Binary `rondo` run with arg
  `react.x86_64` (multi-arch dropper also seen as `react.{mips,mipsel,x86_64}`);
  process masqueraded as a kernel `softirq` thread; mining account `react`.
- **Resource use:** ~**2.3 GB** reserved huge pages (`HugePages_Total` 1169) + pegged CPU → host OOM.
- **Persistence:** multiple root mechanisms incl. an hourly **watchdog re-drop** from
  `/usr/lib/lib` (`./rondo react.{mips,mipsel,x86_64}`) — which is why killing the
  process couldn't hold. `@reboot` entries also present.
- **Tamper / anti-analysis:** files made immutable with `chattr +ia`, then `chattr`
  itself removed; inspection tools (`ps`/`pgrep`/`curl`) killed when run.
- **Privilege level:** root.

## 3. Entry vector (CONFIRMED via logs — not SSH)

The security group `launch-wizard-2` (`sg-0b7fa275a453b96d5`) was wide open:
**22, 3000, 80, 443 all to `0.0.0.0/0`** (4000/API correctly not exposed).

The confirmed chain:

1. **Remote code execution via the internet-exposed Next.js server on port 3000.**
   At 17:55 the journal shows root commands issued from PWD
   `/home/ubuntu/deploy-src/apps/web` (the `yt-web` process context), and the nginx
   access log has **zero entries at 17:5x** — the attacker hit `next-server` on
   `:3000` directly, bypassing nginx. Code executed as the **`ubuntu`** user.
2. **Privilege escalation via default passwordless sudo.** `ubuntu` had
   `ALL=(ALL) NOPASSWD:ALL` (cloud-init default), so `sudo mount -o remount,rw /`
   then `sudo ./rondo react.x86_64` installed and ran the miner as root.

**Specific vulnerability — CVE-2025-55182 ("React2Shell"), CVSS 10.0.** Pre-auth RCE
via insecure deserialization in the React Server Components "Flight" protocol;
affects Next.js 15.0.0–15.0.4 (App Router/SSR). This app ran **Next.js 15.0.3** with
the App Router under `next start` — directly vulnerable. Real-world exploitation
(from Dec 2025) is predominantly coin miners — exactly this case. A single HTTP
request to the running `next-server` yields RCE as `ubuntu`. **Reachable via `:443`
(nginx → :3000), not only the exposed `:3000`** — so an SG `:3000` block alone is
necessary but NOT sufficient; the fix required upgrading Next.js.

**SSH ruled out:** only 2 failed-password attempts ever; all accepted logins were
`publickey` for `ubuntu` from the operator's own (Korean ISP) IPs; **no SSH login
at/near 17:55**. The previously-suspected "extra `authorized_keys` key" was the
operator's own key; the lone AWS-IP login was EC2 Instance Connect (ephemeral
ED25519). Not a backdoor.

Contributing weakness (fixed regardless): the leaked **GitHub PAT** in the git
remote URL.

## 4. Impact

- **Resource theft** — CPU + ~2.3 GB RAM; host degraded to OOM.
- **AWS abuse risk** — the instance role (`aws-code-deploy`) held
  `rds:Create/Delete/Modify` + `ec2:CreateSecurityGroup` (over-permissioned for an
  internet-facing host); credentials were retrievable for the full compromise window.
  **Reassessment found no rogue instances launched and RDS `yt-prod` intact**, but
  only CloudTrail can confirm exactly which API calls were made.
- **Secrets stolen** — everything on the host: DB credentials, `SESSION_SECRET`,
  GitHub PAT. All rotated/revoked in remediation.
- **No user data lost** — the RDS database was empty; RDS was not breached.
- **Served from a rooted host** — possible tampered content to visitors during the window.

## 5. Containment (initial — then failed)

Miner killed and `nr_hugepages` reset to reclaim memory. **This did not hold:** with
no reboot, the miner relaunched ~01:55 because a resident root watchdog re-drops the
kit hourly. Conclusion: **in-place cleaning was not viable; the host had to be taken
offline.** It was stopped, then terminated after the replacement was verified.

## 6. Remediation / rebuild (completed 2026-06-10)

- Forensic snapshot `snap-0ce2c80ac0e98ae88` taken before destruction (completed 100%).
- **Patched the RCE:** Next.js `15.0.3` → **`15.0.8`**.
- **De-privileged services:** `yt-api`/`yt-web` run as no-login **`ytapp`** from
  `/opt/yours-truly` with systemd sandboxing (`NoNewPrivileges`, `ProtectSystem=full`,
  …); `ytapp` may only restart its own units — no blanket `NOPASSWD:ALL`.
- **Locked-down network:** new SG `sg-0a2913fe4d37c882b` exposes only 80/443; app
  ports stay on localhost behind nginx.
- **Clean host:** `i-08c6c815be484c2e5` launched from latest Ubuntu 24.04
  (`ami-0021ac0c2e69d9c55`) via `deploy/bootstrap.sh`.
- **Rotated all secrets:** RDS master password, `SESSION_SECRET`; RDS connection uses
  verify-full TLS via the RDS CA bundle.
- **Cutover:** EIP `44.197.95.242` moved to the new host; Let's Encrypt cert issued;
  `https://yourstruly.it` + `/api/health` verified 200; old host terminated.

## 7. Prevention

**Network (the direct cause)**
- **Never expose app ports (3000/4000) to the internet** — only nginx (443) should
  reach them on localhost. Port 3000 open to `0.0.0.0/0` was the entry point.
- Don't expose SSH (22) to `0.0.0.0/0` — prefer SSM Session Manager or an IP allowlist.
- Add **egress** restrictions (mining needs outbound to a pool — egress filtering would block/flag it).

**Application & least privilege**
- **Run services as a dedicated unprivileged user with NO sudo** (done: `ytapp`). A
  web-tier RCE then stays a non-root, sandboxed process — no root miner, no immutable persistence.
- **Keep the app + dependencies patched.** The RCE was reachable via `:443` too, so
  network changes alone are insufficient — patch the vulnerable component.
- **Minimal instance role** — drop RDS/EC2-provisioning permissions from the host role.

**Access & secrets**
- `PasswordAuthentication no`, `PermitRootLogin no`; `fail2ban` if SSH is internet-facing.
- Prefer **AWS SSM Parameter Store** for secrets over a flat env file on disk.
- Rotate any credential that ever touched a compromised host.

**Detection / ops**
- Alarm on sustained CPU/RAM and huge-page reservation.
- Alert on outbound connections to mining-pool ports/IPs.
- Watch for `chattr +i`, immutable files, and missing core binaries.

## 8. Indicators of Compromise (IOCs)

| Type | Indicator |
| --- | --- |
| Binary / args | `rondo` run as `react.x86_64` (also `react.{mips,mipsel,x86_64}`) |
| Drop paths | `/run/user/1000/lib/`, `/usr/lib/lib/` |
| Process disguise | fake `softirq` kernel thread; mining account `react` |
| Memory | ~2.3 GB huge pages (`HugePages_Total` 1169) |
| Network | `45.125.66.100:444` (mining pool) |
| Tamper | `/usr/bin/chattr` removed; `ps`/`pgrep`/`curl` killed when run |
| Persistence | hourly root watchdog re-drop from `/usr/lib/lib`; `@reboot` entries |
| Vulnerability | **CVE-2025-55182** (React2Shell) — Next.js 15.0.3 RSC Flight RCE |

## 9. Open follow-ups

- [ ] **Revoke the leaked GitHub PAT** (repo is public; nothing depends on it).
- [ ] **Review CloudTrail** for `i-011a7e6377f9f0d18`'s role activity over 17:55 → termination.
- [ ] Trim the `aws-code-deploy` role to least privilege.
- [ ] Optionally mount `snap-0ce2c80ac0e98ae88` read-only for deeper forensics (full `auth.log`, key audit).
