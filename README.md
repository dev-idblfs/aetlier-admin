# Aetlier Admin

Internal staff dashboard for the Aetlier platform (appointments, doctors, finance, RBAC, settings).

## Stack

- Next.js 16 (App Router) + React 19
- JavaScript (`.jsx`) — not TypeScript
- Redux Toolkit + RTK Query
- Tailwind CSS v4 + HeroUI v3 (`@heroui/react` + `@heroui/styles`)
- Import HeroUI through `@/lib/heroui` (v2-compatible wrappers)
- Yarn 1.22

## Setup

```bash
cp .env.example .env.local
yarn install
yarn dev   # http://localhost:3001
```

### Environment

See `.env.example`:

- `NEXT_PUBLIC_API_URL` — backend API (default `http://localhost:8000`)
- `NEXT_PUBLIC_FRONTEND_URL` — public web app
- `NEXT_PUBLIC_ADMIN_URL` — this admin app
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth (optional)

## Commands

```bash
yarn dev      # next dev on port 3001
yarn build    # production build
yarn start    # serve production build
yarn lint     # eslint
```

## Architecture

Canonical app code is under `app/` (ignore legacy `src/app/`). Shell: `AdminLayout` + API-driven `Sidebar` (`GET /settings/navigation`). Data: one RTK slice `redux/services/api.js`. Shared UI: `components/ui/` (StatusBadge, EntityLink, FilterBar, Alert, SectionCard, DataTable, …).

Permissions use backend `resource.action.scope` strings via `utils/permissions.js`.

## Docs for agents

See `AGENTS.md` and `.cursor/rules/` before making changes.
