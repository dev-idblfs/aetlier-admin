# Admin: Doctor verification & RBAC

## Permissions (database / `seed_rbac.py`)

| Permission | Typical roles | Used for |
|------------|---------------|----------|
| `verification.verify.any` | admin, super_admin | View queue, preview documents, approve/reject **documents** |
| `verification.approve.any` | admin, super_admin | Approve/reject **overall** verification |
| `doctor.read.any` | admin, doctor (read) | Doctors list & profiles |
| `doctor.update.any` | admin | Edit doctor profiles |
| `doctor.create.any` | admin | Add doctor manually |
| `doctor.delete.any` | admin | Delete doctors |

Doctor role (patient app) has `verification.upload_docs.own` only.

After changing permissions, run:

```bash
cd aetlier-backend
echo yes | python3 scripts/seed_rbac.py
```

Re-login to admin so the JWT includes updated permissions.

## Approval workflow (recommended order)

1. **Verification** sidebar → open a pending submission (or **Doctors** → Review verification).
2. **Review each document** — preview file, approve or reject with notes (`verification.verify.any`).
3. **Approve or reject application** — final decision (`verification.approve.any`).
4. On **approve**: `User.is_verified` and `DoctorProfile.is_published` are set automatically; doctor appears on the public directory.
5. On **reject**: doctor can re-upload from the patient app (`/dashboard/verification`).

## UI surfaces

- `/verification` — queue with status filter and workflow summary
- `/verification/[id]` — full review (steps, documents, actions, audit)
- `/doctors` — list shows **Verification** + **Profile** columns; detail modal links to review
- `/doctors/[id]/edit` — profile form + embedded verification section

## Backend APIs

- `GET /api/verification/admin/pending` — queue
- `GET /api/verification/admin/records/{verification_id}` — single record for review
- `PUT /api/verification/admin/document/{document_id}/verify` — per-document
- `PUT /api/verification/admin/{verification_id}/status` — final approve/reject
- `GET /api/doctors` — includes `verification_status`, `verification_id`, `user_id` on each doctor
