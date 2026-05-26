# Auth Role-Check Audit

Snapshot of every place in the codebase that decides "is this user an
admin?" as of branch `main` HEAD pre-stabilization. Captured to drive
the canonicalization on a single source of truth: **Mongo
`User.isAdmin === true`**.

## TL;DR

There are **three** parallel admin-detection mechanisms live in the
codebase today:

1. **Mongo `User.isAdmin: boolean`** — set by `scripts/grant-admin.ts`
   and `scripts/seed-admin.ts`, and on user-creation by the Clerk
   webhook for the `@internetkeeda.com` email domain. Read by
   `/admin/moderation/page.tsx` and the *fallback* branch of
   `src/app/api/lib/admin.ts`.
2. **Clerk `publicMetadata.role === 'admin'`** — set by the Clerk
   webhook for `@internetkeeda.com` on `user.created`. Read by 12+
   client and server call sites including `AdminProtectedRoute`, the
   theme-two navbars, the affiliate admin routes, the config-upload
   routes, and the legacy review-management UI.
3. **Email-domain allowlist (`@internetkeeda.com`)** — embedded
   directly in five `/api/config/upload-*` routes as `userEmail.
   endsWith('@internetkeeda.com')` and used as an `||` fallback when
   `publicMetadata.role !== 'admin'`. Also in the Clerk webhook as
   the *seed* for mechanisms 1 and 2.

`requireAdmin` at `src/app/api/lib/admin.ts:15` already short-circuits
on mechanism 2 and only falls back to mechanism 1 — so for an admin
whose Clerk metadata says `role: 'admin'` but whose Mongo row has
`isAdmin: false`, this guard passes. That makes mechanism 1 *not*
the source of truth at the API layer today.

## Every admin gate

### Server-side helper (the one true `requireAdmin`)

| File:Line | Source(s) Read | Notes |
|-----------|----------------|-------|
| `src/app/api/lib/admin.ts:15-39` | Clerk `publicMetadata.role` (1st), Mongo `isAdmin` (2nd) | Throws on fail. Used by ~20 admin API routes. |

### Server-side inline checks (bypass the helper)

| File:Line | Source Read | Why It's A Problem |
|-----------|-------------|---------------------|
| `src/app/api/admin/affiliates/route.ts:16-17` | Clerk `publicMetadata.role` | Inline, no Mongo fallback |
| `src/app/api/admin/affiliates/settings/route.ts:13,32` | Clerk `publicMetadata.role` | Inline, no Mongo fallback |
| `src/app/api/admin/affiliates/payout/route.ts:17` | Clerk `publicMetadata.role` | Inline, no Mongo fallback |
| `src/app/api/admin/affiliates/adjust/route.ts:14` | Clerk `publicMetadata.role` | Inline, no Mongo fallback |
| `src/app/api/config/route.ts:100-104` | Clerk `publicMetadata.role` OR email domain | Inline, dual-source |
| `src/app/api/config/upload-og-image/route.ts:13-17` | Clerk `publicMetadata.role` OR email domain | Inline, dual-source |
| `src/app/api/config/upload-logo/route.ts:13-17` | Clerk `publicMetadata.role` OR email domain | Inline, dual-source |
| `src/app/api/config/upload-logo-light/route.ts:13-17` | Clerk `publicMetadata.role` OR email domain | Inline, dual-source |
| `src/app/api/config/upload-logo-dark/route.ts:13-17` | Clerk `publicMetadata.role` OR email domain | Inline, dual-source |
| `src/app/api/config/upload-favicon/route.ts:13-17` | Clerk `publicMetadata.role` OR email domain | Inline, dual-source |
| `src/app/api/reviews/[id]/route.ts:84-86,128` | Clerk `publicMetadata.role` | Mixes admin-check with ownership-check; PATCH allows admin OR superadmin, DELETE only allows admin |
| `src/app/api/reviews/[id]/moderate/route.ts:41-43` | Clerk `publicMetadata.role` | Inline |
| `src/themes/theme-one/pages/api/users/index.ts:18`<br>`src/themes/theme-one/pages/api/users/role.ts:17`<br>`src/themes/theme-one/pages/api/users/status.ts:17`<br>`src/themes/theme-one/pages/api/users/[userId]/activity.ts:17`<br>`src/themes/theme-two/pages/api/users/index.ts:17`<br>`src/themes/theme-two/pages/api/users/role.ts:17`<br>`src/themes/theme-two/pages/api/users/status.ts:17`<br>`src/themes/theme-two/pages/api/users/[userId]/activity.ts:17` | Clerk `publicMetadata.role` | Pages-Router admin endpoints, parallel to App Router admin endpoints |
| `src/app/admin/moderation/page.tsx:29,53` | Mongo `User.isAdmin` only | The one server-rendered page that already uses Mongo isAdmin — outlier |

### Client-side admin gates

| File:Line | Source Read | Notes |
|-----------|-------------|-------|
| `src/components/admin/auth/AdminProtectedRoute.tsx:25,50` | Clerk `publicMetadata.role` | Gates **every** `/admin/*` client page via the wrapper in `src/app/admin/*/page.tsx` |
| `src/components/admin/reviews/ReviewManagement.tsx:23` | Clerk `publicMetadata.role` | |
| `src/components/admin/reviews/AdminReviewList.tsx:49` | Clerk `publicMetadata.role` (accepts superadmin) | |
| `src/themes/theme-two/components/Navigation.tsx:77` | Clerk `publicMetadata.role` | Theme-two public navbar |
| `src/themes/theme-two/components/ThemeTwoNavigation.tsx:45` | Clerk `publicMetadata.role` | Theme-two alt navbar |
| `src/themes/theme-two/components/admin/reviews/AdminReviewList.tsx:42` | Clerk `publicMetadata.role` | |
| `src/themes/theme-one/components/Navigation.tsx:162` | Mongo `isAdmin` via `/api/users/me` | Theme-one navbar — the right pattern, already on Mongo |
| `src/themes/theme-one/pages/Dashboard.tsx:445` | Mongo `isAdmin` via `/api/users/me` | Already on Mongo |
| `src/components/admin/users/RoleChangeDialog.tsx:130,136`<br>`src/components/admin/users/UserDetailsDialog.tsx:178` | `user.role === 'admin'` (Mongo `role` field?) | Reads a `user.role` string that the User schema *does not define* — see schema mismatch below |

### Webhook & scripts

| File:Line | Writes |
|-----------|--------|
| `src/app/api/webhooks/clerk/route.ts:90,109,124` | On user.created from `@internetkeeda.com`: writes BOTH Mongo `isAdmin: true` AND Clerk `publicMetadata.role: 'admin'` |
| `scripts/grant-admin.ts` | Mongo `isAdmin: true` only — does not touch Clerk |
| `scripts/seed-admin.ts` | Mongo `isAdmin: true` only — does not touch Clerk |

## Inconsistencies & dead ends

1. **Schema vs. usage mismatch.** `src/types/user.ts:5` declares
   `role: 'admin' | 'user'` and components in
   `src/components/admin/users/` read `user.role`, but the Mongoose
   schema at `src/app/api/models/User.ts` defines no `role` field.
   These dialogs render whatever `role` string the admin-users API
   returns from Clerk metadata — a property that does not exist on
   the Mongo User. Effectively dead code that "works" only because
   `src/app/api/users/route.ts:17` synthesizes a `role` field on
   the fly from Clerk `publicMetadata.role`.
2. **Superadmin vs admin asymmetry.** Three places accept
   `'superadmin'` as an admin-equivalent (`AdminReviewList.tsx:49`,
   `reviews/[id]/route.ts:85`), most do not. There is no place that
   *grants* `superadmin`, so this branch is unreachable.
3. **Email-domain allowlist is a backdoor.** Six config routes treat
   `@internetkeeda.com` email as admin **regardless** of Mongo
   `isAdmin` or Clerk role. So removing someone's admin via
   `grant-admin --remove` (does not exist) or Clerk dashboard would
   not actually revoke their config-upload access.
4. **Stale `void pathname` was the only pathname use in
   Navigation.tsx before today's bug-D fix.** Listed for completeness.
5. **Pages Router parallel admin endpoints.** Four endpoints exist
   under `src/themes/theme-{one,two}/pages/api/users/*` that duplicate
   App Router endpoints under `/api/users` and use the inline Clerk
   role check. Whether these are still routed is unclear — the
   `src/themes/.../pages/api` directory pattern is unusual under
   Next.js App Router and may be dead.
6. **No middleware admin enforcement.** `src/middleware.ts:68-70`
   calls `auth.protect()` on `/admin` but that only gates
   authentication. A signed-in non-admin can render `/admin` until
   the AdminProtectedRoute client component redirects.

## Error-return audit (Section 1.2)

`grep -rn "currentUser\|auth()" src/app/api/` matches ~15 routes.
Spot-checked behavior when signed-out user hits each:

| Route | Signed-out behavior | Notes |
|-------|--------------------|-------|
| `/api/users/me` GET | **500** (Failed to fetch user profile) | `requireAuth` throws "Unauthorized"; outer catch maps it to a 500 via `errorResponse(..., 500)`. **This is Bug A.** |
| `/api/admin/*` (via `requireAdmin`) | 401 via `adminErrorResponse` | Correct |
| `/api/admin/affiliates/*` (inline check) | 401 inline | Correct but duplicated |
| `/api/users` (admin user list) | No auth at all — relies on middleware `auth.protect()` | Outside `/admin/*` middleware guard; **CVE: signed-out user gets a 100-user dump from Clerk**. (Pre-existing; out of scope for this session unless the bug list grows.) |

All other `try { requireAuth() } catch { errorResponse(..., 500) }`
patterns share Bug A's shape. Audit will be re-run after the fix.

## Footprint (Section 1.3)

```
1597 src/themes/theme-one/pages/Dashboard.tsx
1576 src/themes/theme-two/pages/Dashboard.tsx
 423 src/components/admin/layout/AdminLayout.tsx
3596 total
```

## Decisions made for canonicalization

- **Single source of truth, server-side**: `User.findOne({ clerkId
  }).isAdmin === true`. No fallback to Clerk metadata. No fallback
  to email domain.
- **Client-side fast read**: mirror Mongo `isAdmin` into Clerk
  `publicMetadata.isAdmin` via `scripts/sync-admin-to-clerk.ts`, and
  read `publicMetadata.isAdmin` everywhere on the client to avoid an
  extra `/api/users/me` roundtrip on first paint. The legacy
  `publicMetadata.role === 'admin'` is kept readable as a transitional
  fallback only inside `AdminProtectedRoute` and the theme-two
  navbars, removable in a follow-up commit after the sync script has
  been run in production.
- **Email-domain shortcut removed.** Webhook still seeds new
  `@internetkeeda.com` accounts to `isAdmin: true` on user.created,
  but the runtime `endsWith('@internetkeeda.com')` checks in the
  config-upload routes are deleted.
- **`role`-string field on dialog UI**: kept as a display-only
  derivation from `isAdmin` (`isAdmin ? 'admin' : 'user'`) so we
  don't have to rip out the dialogs.
- **Pages-router admin endpoints**: left untouched in this pass;
  flagged as suspected-dead.
