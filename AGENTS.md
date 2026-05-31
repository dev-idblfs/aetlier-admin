# AGENTS.md — Aetlier Admin

Internal admin dashboard (Next.js) for the Aetlier platform. This file is the
canonical guide for AI agents. Read it before making changes.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **JavaScript** (`.jsx`/`.js`) — NOT TypeScript. Do not add TS unless explicitly asked.
- **Redux Toolkit + RTK Query** for state/data
- **Tailwind CSS v4** + **HeroUI**; `framer-motion`, `lucide-react`
- Forms: `react-hook-form` + `@hookform/resolvers/zod` (schemas in `lib/validation/`)
- Package manager: **Yarn 1.22**. Import alias `@/*` → repo root.

## Commands

```bash
yarn dev      # next dev on port 3001
yarn build    # next build
yarn lint     # eslint (flat config: eslint.config.mjs)
```

- **No** `test`, `format`, or `typecheck` scripts. **No Prettier** — match the existing quote/style of the file you edit.
- Env vars (`config/index.js`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `NEXT_PUBLIC_ADMIN_URL`.

## Directory structure

```
app/                       App Router (PRIMARY app code)
  layout.jsx               Root: Providers, force-dynamic, Inter font
  login/  auth/callback/   Auth entry (redirect-based)
  (dashboard)/             Route group — NOT part of the URL
    layout.jsx             AdminLayout shell
    appointments/ doctors/ users/ roles/ permissions/
    services/ verification/ leads/ settings/ finance/
components/  layout/ (AdminLayout, Sidebar, Header), ui/ (barrel), verification/, invoice/
features/    Domain modules (services, categories)
redux/       store.js, services/api.js (single RTK Query slice), slices/authSlice.js
lib/         apiClient.js (axios), validation/ (Zod schemas)
utils/       permissions.js, cn.js, dateFormatters.js
constants/ config/ hooks/ contexts/
```

> Ignore the legacy scaffold under `src/app/` — active code lives in `app/`. Ignore `*.backup` files.

## Conventions

- `'use client'` on pages, the layout shell, and most components. Root layout already sets `export const dynamic = 'force-dynamic'` globally — match it on new dashboard pages where needed.
- The **`(dashboard)` route group** does NOT appear in URLs: `app/(dashboard)/verification/page.jsx` → `/verification`.
- Add route-level `loading.jsx` for sections with data fetching, matching existing sections.
- Import shared UI from the barrel: `import { PageHeader, DataTable, Button } from '@/components/ui'`.
- Forms: define Zod schemas in `lib/validation/index.js`, use `react-hook-form` + shared `components/ui/FormFields`.
- Set page title/breadcrumbs via `SidebarContext` (from `AdminLayout`).

## Data fetching

- **RTK Query is the single source** — add endpoints to `redux/services/api.js` (one `createApi` slice) and export the generated hook at the bottom of the file.
- `fetchBaseQuery` injects the Bearer token from cookie `admin_access_token`; a global 401 handler clears the cookie and redirects to `/login`.
- Use **tag-based caching**: declare `tagTypes`, set `providesTags` on queries and `invalidatesTags` on mutations.
- Use axios `apiClient` (`lib/apiClient.js`) ONLY for the auth profile fetch in `authSlice`. Prefer RTK Query everywhere else — do not add new ad-hoc axios calls.

## Auth & RBAC

- Login is **redirect-based**: `/login` → main frontend with `adminRedirect` → `/auth/callback?token=...` stores the cookie and dispatches `setCredentials`. Do NOT build a separate login form here.
- `AdminLayout` loads the profile + permissions and gates access to roles `admin | super_admin | superadmin`.
- **Client-side permission checks** use `utils/permissions.js`: `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `hasRole`, `isAdmin`, `isSuperAdmin`. Super admins bypass all checks.
- Permission strings use the backend dot-notation in the `PERMISSIONS` object (e.g. `appointment.read.any`, `verification.verify.any`). Add new permissions there, keeping them aligned with the backend.
- Pattern: `const user = useSelector(s => s.auth.user)` → `hasPermission(user, PERMISSIONS.X)`; gate queries with `{ skip: !canView }`.
- Admin portal entry is gated by `canAccessAdminPortal(user)` (`utils/permissions.js`), which prefers the backend `user.can_access_admin_app` and falls back to the `admin.portal.access` permission. The portal flags (`grants_admin_portal`, `prefer_admin_redirect_on_login`) live on **roles**, not users, and are editable from the Roles page.
- Sidebar nav is permission-filtered **server-side** via `useGetNavigationQuery`. To add a nav icon, extend `ICON_MAP` in `components/layout/Sidebar.jsx`.

## Coding Principles (apply to every change)

- **Reuse first**: before creating a component, hook, or util, search the codebase — especially the `components/ui/` barrel, `components/`, and `features/`. If one exists, reuse it; extend/parameterize it via props for the new use case instead of duplicating.
- **Generic, shared, library-style**: build small composable building blocks; promote anything reused across pages into the shared `components/ui/` library (exported via its barrel) and compose pages from those blocks.
- **Pure components**: derive UI from props/state; no side effects during render, no hidden global mutations — side effects belong in `useEffect`/event handlers. Prefer presentational components driven entirely by props.
- **Loose coupling**: components communicate through props/callbacks, not by reaching into each other's internals. Fetch data via RTK Query hooks at the page level and pass it down; avoid tight cross-imports and circular deps.
- **Readable & modern**: small focused components, clear names, follow existing structure, and use current Next.js 16 / React 19 idioms.

## Gotchas

- Tailwind v4 config lives in `hero.ts` (imported via `@config` in `app/globals.css`), not a classic `tailwind.config.js`.
- No Prettier/format script — keep diffs consistent with surrounding code.
- Many root-level `*_IMPLEMENTATION.md` / `INVOICE_*.md` are historical notes, not coding conventions.
