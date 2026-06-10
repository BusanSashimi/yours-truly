# Rebuild Runbook — replace the compromised host

The original app host was root-compromised (see `docs/security-incident-2026-06-09.md`:
CVE-2025-55182 RCE in Next.js 15.0.3 → `ubuntu` `NOPASSWD:ALL` → root miner).
This rebuilds a clean host from infra-as-code and rotates all secrets. RDS is
separate and unaffected.

## Root-cause fixes already applied in the repo
1. **Next.js upgraded `15.0.3` → `15.0.8`** (`apps/web/package.json` + lockfile) — patches the RCE.
2. **Services de-privileged**: `yt-api`/`yt-web` units now run as the no-login
   user **`ytapp`** from `/opt/yours-truly`, with systemd sandboxing
   (`NoNewPrivileges`, `ProtectSystem=full`, …). `ytapp` has **no sudo** except
   restarting its own two units.
3. **SG exposes only 80/443** (`sg-0a2913fe4d37c882b`); app ports 3000/4000 stay on localhost.

## Facts (us-east-1)

| Item | Value |
| --- | --- |
| Compromised instance | `i-011a7e6377f9f0d18` (terminate after cutover) |
| Forensic snapshot | `snap-0ce2c80ac0e98ae88` (preserved) |
| New AMI | `ami-0021ac0c2e69d9c55` (Ubuntu 24.04, 2026-06-04) |
| Instance type | `t3.medium` |
| Subnet | `subnet-025af377476c104d5` (us-east-1a) |
| Security group | `sg-0a2913fe4d37c882b` (80/443 only) |
| IAM instance profile | `aws-code-deploy` (reused — provides SSM access) |
| Elastic IP | `44.197.95.242` |
| Access | SSM Session Manager (no inbound SSH) |
| Repo | `https://github.com/BusanSashimi/yours-truly.git` (public) |

## Order of operations

### 0. Stop the compromised box (halts active mining + role-credential exposure)
```
aws ec2 stop-instances --instance-ids i-011a7e6377f9f0d18 --region us-east-1
```

### 1. Launch the clean instance (user-data = deploy/bootstrap.sh)
```
aws ec2 run-instances --region us-east-1 \
  --image-id ami-0021ac0c2e69d9c55 --instance-type t3.medium \
  --subnet-id subnet-025af377476c104d5 \
  --security-group-ids sg-0a2913fe4d37c882b \
  --iam-instance-profile Name=aws-code-deploy \
  --user-data file://deploy/bootstrap.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=yt-prod-2}]'
```

### 2. Verify SSM registration (proves we have access before cutover)
```
aws ssm describe-instance-information --region us-east-1 \
  --query "InstanceInformationList[].{Id:InstanceId,Ping:PingStatus}"
```
If the new instance does **not** appear within a few minutes, `aws-code-deploy`
lacks SSM permissions — fall back to temporarily allowing port 22 from your IP,
or attach `AmazonSSMManagedInstanceCore` to the role.

### 3. Rotate secrets, then write `/etc/yours-truly/api.env` (over SSM, as root)
- RDS master password: `aws rds modify-db-instance --db-instance-identifier yt-prod --master-user-password '<new>' --apply-immediately`
- `SESSION_SECRET`: `openssl rand -hex 32`
- **GitHub PAT**: revoke the leaked token in GitHub settings (repo is public, so the new host needs no token).
- Write `api.env` from `deploy/api.env.example` with the rotated `DATABASE_URL` (RDS endpoint) + `SESSION_SECRET`, and `DATABASE_CA=/etc/yours-truly/rds-ca.pem` (bootstrap installed the bundle) for verify-full TLS; `chown root:ytapp`, `chmod 640`.

### 4. Start services & issue TLS (over SSM, as root)
```
systemctl start yt-api yt-web
# Point the EIP here FIRST (step 5) so the ACME HTTP-01 challenge resolves, then:
certbot --nginx -d yourstruly.it -d www.yourstruly.it --non-interactive --agree-tos -m <you@domain>
systemctl reload nginx
```

### 5. Move the Elastic IP to the new box
```
ALLOC=$(aws ec2 describe-addresses --public-ips 44.197.95.242 --region us-east-1 --query 'Addresses[0].AllocationId' --output text)
aws ec2 associate-address --region us-east-1 --allocation-id "$ALLOC" --instance-id <new-instance-id> --allow-reassociation
```

### 6. Verify, then terminate the old box
```
curl -sS -o /dev/null -w '%{http_code}\n' https://yourstruly.it/
aws ec2 terminate-instances --instance-ids i-011a7e6377f9f0d18 --region us-east-1
```

### 7. Post-incident
- Review CloudTrail for `i-011a7e6377f9f0d18`'s role activity over the 17:55→now window.
- Consider trimming `aws-code-deploy` to least privilege (drop RDS/EC2 provisioning perms).
