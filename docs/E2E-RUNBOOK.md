# E2E Runbook

`e2e/critical-path.spec.ts` covers the post-stabilization happy path
against whatever `baseURL` points at (default: production). The
public-surface tests are runnable as-is; the authenticated tests are
gated on env vars because they require pre-provisioned Clerk + Mongo
test users.

## Running the public-surface suite

```bash
npx playwright install --with-deps chromium   # one-time
npx playwright test --grep "public surface"
```

Expected: 4 tests pass against `https://www.internetkeeda.com`. The
critical assertion is `/api/users/me` returns **401** (not 500) when
unauthenticated — that's the Bug A regression test.

## Running the full suite (authenticated tests)

The auth tests use [Playwright storage state](https://playwright.dev/docs/auth)
to skip the Clerk sign-in flow at test time. You provide the
storage-state JSON files via env vars:

```bash
export PLAYWRIGHT_USER_STATE=./e2e/state/user.json
export PLAYWRIGHT_ADMIN_STATE=./e2e/state/admin.json
npx playwright test
```

### Provisioning the state files

This step **creates real Clerk users in whatever environment baseURL
points at** — do not run it autonomously. Either:

1. **Manually**: open the site in a browser, sign up two accounts (a
   regular one and one you elevate via `npx tsx scripts/grant-admin.ts
   <email>` followed by `npx tsx scripts/sync-admin-to-clerk.ts`).
   Then, in a Playwright codegen session, sign in as each and save
   `storageState` to `./e2e/state/{user,admin}.json`:

   ```bash
   npx playwright codegen --save-storage=./e2e/state/user.json https://www.internetkeeda.com/sign-in
   ```

2. **Scripted setup (not yet implemented)**: a `setup` project in
   `playwright.config.ts` that calls `@clerk/testing/playwright`
   `setupClerkTestingToken` + `clerkClient.users.createUser`. Add this
   when there is a staging environment so the test users don't land
   in production Clerk.

### Cleanup

The provisioned users persist in Clerk + Mongo until you delete them
— production Clerk dashboard → Users, or `clerkClient.users.deleteUser
(id)`, plus `User.deleteOne({ clerkId })` in Mongo.

## Why this is gated

The mandate (Section 4) asks for the full suite to run end-to-end with
test users provisioned in beforeAll. That works fine in a CI
environment with a dedicated staging Clerk org, but inside this repo
the default baseURL is production. Creating Clerk users + Mongo rows
in production from an automated test run is the kind of action that
needs an explicit human go-ahead — so the suite ships pre-wired but
opt-in. Drop the `test.skip(!process.env.PLAYWRIGHT_..._STATE)` lines
once a staging environment exists.
