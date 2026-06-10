# CloudTrail Investigation — compromise window

Goal: determine whether the compromised instance's IAM role was used against the
AWS API while the host was owned. Related: `docs/security-incident-2026-06-09.md`.

> Run these with an admin/console identity — the `busan-sashimi` user has no
> CloudTrail permissions (`LookupEvents`/`ListTrails` denied).

## Scope

| Parameter | Value |
| --- | --- |
| Account | `905418455758` |
| Region | `us-east-1` (management events; IAM/STS/global events also land here) |
| Compromised principal | role behind instance profile `aws-code-deploy` (`<ROLE_NAME>`) |
| **Identity match** | assumed-role **session name = instance ID `i-011a7e6377f9f0d18`** |
| Window | **2026-06-09T17:50:00Z → 2026-06-10T06:00:00Z** (compromise → terminate). Widen to the full 24h to baseline the legit 09:13–09:24 deploy activity. |

When the instance role is used, events look like:

```
userIdentity.type = "AssumedRole"
userIdentity.arn  = "arn:aws:sts::905418455758:assumed-role/<ROLE_NAME>/i-011a7e6377f9f0d18"
userIdentity.sessionContext.sessionIssuer.userName = "<ROLE_NAME>"
sourceIPAddress = 44.197.95.242  (the box)  ← anything ELSE = credential exfiltration
```

## The two things to find

1. **Off-box use of the role** — any event with that assumed-role identity but a
   `sourceIPAddress` that is **not** `44.197.95.242` (or the `172.31.x` private IP).
   Strongest sign the creds were stolen and used elsewhere. (IMDSv2 limits this —
   confirm the instance enforced it.)
2. **Mutating calls the deploy role had no business making** in the window (red flags below).

## Queries

### A. Console (fastest)
CloudTrail → **Event history** → set the time window → filter
**User name = `i-011a7e6377f9f0d18`** → export CSV → sort by Event source / Event
name → scan source IPs.

### B. CLI — `aws cloudtrail lookup-events` (90-day management history)

```bash
aws cloudtrail lookup-events --region us-east-1 \
  --start-time 2026-06-09T17:50:00Z --end-time 2026-06-10T06:00:00Z \
  --lookup-attributes AttributeKey=Username,AttributeValue=i-011a7e6377f9f0d18 \
  --max-results 1000 > ct.json

# mutating calls only (drop Describe/Get/List), with IP + result:
jq -r '.Events[].CloudTrailEvent | fromjson
  | select(.eventName|test("^(Describe|Get|List|Lookup)")|not)
  | [.eventTime, .eventName, .sourceIPAddress, (.errorCode//"OK")] | @tsv' ct.json | sort

# any source IP that ISN'T the box (exfiltration check):
jq -r '.Events[].CloudTrailEvent | fromjson
  | select(.sourceIPAddress|test("44\\.197\\.95\\.242|^172\\.31\\.")|not)
  | [.eventTime,.eventName,.sourceIPAddress] | @tsv' ct.json
```

### C. Athena (if a trail ships to S3 — best for full history)

```sql
SELECT eventtime, eventsource, eventname, sourceipaddress, errorcode,
       json_extract_scalar(useridentity.sessioncontext, '$.sessionissuer.username') AS role
FROM cloudtrail_logs
WHERE useridentity.arn LIKE '%assumed-role/%/i-011a7e6377f9f0d18'
  AND eventtime BETWEEN '2026-06-09T17:50:00Z' AND '2026-06-10T06:00:00Z'
ORDER BY eventtime;
```

## Prioritized red flags (hunt these event names)

- **Credential / identity expansion** (persistence beyond the box — highest priority):
  `CreateAccessKey`, `CreateUser`, `CreateRole`, `AttachUserPolicy`, `PutUserPolicy`,
  `AttachRolePolicy`, `UpdateAssumeRolePolicy`, `GetSessionToken`.
- **Data exfil via RDS**: `CreateDBSnapshot` → **`ModifyDBSnapshotAttribute`** (sharing
  a snapshot to an external account), `RestoreDBInstanceFromDBSnapshot`, `DeleteDBInstance`.
- **Compute abuse**: `RunInstances`, `RequestSpotInstances`, `CreateKeyPair`.
- **Network changes**: `CreateSecurityGroup`, `AuthorizeSecurityGroupIngress`.
- **Recon signature**: a burst of `errorCode = AccessDenied` / `UnauthorizedOperation`
  (attacker probing what the role can do).

## Expected benign baseline

The reassessment already confirmed **no rogue instances and RDS intact**. The
likely-clean result: only `Describe*`/`Get*` calls plus the legit RDS-migration
activity (09:13–09:24, *outside* the compromise window), all from `44.197.95.242`.
Anything **mutating, or from another IP, inside 17:50→06:00** is the finding.

## If you find something

- Off-box use or identity-expansion calls → assume account-level compromise: rotate
  **all** IAM user/access keys, review every IAM principal created/modified in the
  window, and check for unexpected resources in all regions (not just us-east-1).
- Shared RDS snapshot → find the target account ID in the event and treat the (empty)
  DB as exposed; revoke the share via `ModifyDBSnapshotAttribute --attribute restore --values-to-remove`.
- Nothing mutating, all from the box IP → close the item; the blast radius was the
  host only (consistent with the current assessment).
