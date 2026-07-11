# Platform console

Path-based console in **aetlier-admin** for control-plane operators.
Production Host remains `platform.admin.<domain>`; locally use
`http://localhost:3001/platform`.

## What super-admin can do

| Capability | UI | Notes |
|------------|----|-------|
| `tenants_read` | Overview, tenants, audit, cutover status | |
| `tenants_onboard` | Onboard + **edit metadata/flags/notes** | |
| `tenants_suspend` | Suspend / unsuspend | Evicts clinic engines |
| `tenants_retry` | Retry provision / drop orphan DB | |
| `operators_manage` | Operators list/create/disable/caps | |

## What it cannot do (v1)

- Patient multi-tenant booking / marketplace
- Move legacy clinic data into a new DB (register-in-place only)
- Impersonate clinic users (deferred)
- Per-tenant WhatsApp/S3 productization (stub later)
- Stripe billing (plan_tier is a label only)

## Routes

| Path | Purpose |
|------|---------|
| `/platform/login` | Operator login |
| `/platform` | Overview + tenant #1 cutover card |
| `/platform/tenants` | List |
| `/platform/tenants/new` | Onboard hosted \| BYO |
| `/platform/tenants/[id]` | Detail, flags, notes, audit, open clinic admin |
| `/platform/operators` | Operator CRUD |
| `/platform/audit` | Global audit log |

## Auth isolation

| | Clinic admin | Platform console |
|--|--------------|------------------|
| Cookie | `admin_access_token` | `platform_access_token` |
| JWT `aud` | `clinic` | `platform` |
| Login | `/login` | `/platform/login` |

Cookies are **host-only**. Never put DB URLs or `secret_ref` in API responses.

## Feature flags (P0)

Per tenant JSON (defaults true):

- `booking_enabled` — enforced on `POST /api/appointments` when Host is tenant-bound
- `mobile_enabled` — stored; mobile clients should honor when wired

Suspend remains the hard kill switch (403 on clinic Host).

## Tenant #1

See backend `docs/TENANT1_RUNBOOK.md`. Data is **registered**, not copied.
Overview shows cutover status from `GET /api/platform/cutover/status`.

## Gateway URLs

- Platform: `https://platform.admin.<domain>/platform` (or path on admin app)
- Clinic: `https://{slug}.admin.<domain>` (deep link on tenant detail)
