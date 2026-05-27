/**
 * Critical-path e2e for the stabilization sweep.
 *
 * Coverage:
 *   1. Public surface — / loads, /sign-in renders Clerk widget,
 *      /api/users/me unauthenticated returns 401 (not 500),
 *      /api/categories returns at least 30 items.
 *   2. Regular user — navbar shows avatar; GET /admin redirects to /;
 *      /api/users/me returns 200.
 *   3. Admin user — GET /admin renders the admin dashboard with no
 *      infinite redirect.
 *   4. Sign-out — clicking the dropdown's Sign out lands on / and the
 *      navbar reverts to a Sign-in button; reload preserves signed-out
 *      state.
 *
 * Auth tests are GATED on env vars. Each test that needs an
 * authenticated session expects to be invoked with a Playwright
 * storageState already populated by the helper users — that helper is
 * intentionally NOT bundled here because it creates real Clerk users
 * in whatever environment baseURL points at. To run the gated suite
 * end-to-end, see docs/E2E-RUNBOOK.md and provide the storageState
 * paths via PLAYWRIGHT_USER_STATE / PLAYWRIGHT_ADMIN_STATE.
 */
import { test, expect, request } from "@playwright/test";

test.describe("public surface", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Internet Keeda/i);
  });

  test("sign-in page renders Clerk widget", async ({ page }) => {
    await page.goto("/sign-in");
    // Clerk attaches .cl-component or data-clerk-* attributes.
    const clerkRoot = page.locator('[class*="cl-"], [data-clerk-element]').first();
    await expect(clerkRoot).toBeVisible({ timeout: 10_000 });
  });

  test("/api/users/me unauthenticated returns 401, not 500", async ({ request }) => {
    const res = await request.get("/api/users/me");
    expect(res.status()).toBe(401);
    expect(res.status()).not.toBe(500);
  });

  test("/api/categories returns at least 30 items", async ({ request }) => {
    const res = await request.get("/api/categories");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const items = Array.isArray(body) ? body : body?.data ?? body?.items ?? [];
    expect(items.length).toBeGreaterThanOrEqual(30);
  });
});

test.describe("authenticated as regular user", () => {
  test.skip(!process.env.PLAYWRIGHT_USER_STATE, "no PLAYWRIGHT_USER_STATE — skipping");
  test.use({ storageState: process.env.PLAYWRIGHT_USER_STATE });

  test("navbar shows avatar dropdown trigger", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /account menu|avatar/i })).toBeVisible({ timeout: 5_000 });
  });

  test("GET /admin redirects to /, does not crash", async ({ page }) => {
    const resp = await page.goto("/admin");
    expect(resp).not.toBeNull();
    // AdminProtectedRoute is client-side, so the navigation completes
    // with status 200 and then redirects. Wait for the URL to settle.
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/dashboard", {
      timeout: 5_000,
    });
  });

  test("/api/users/me authenticated returns 200", async ({ request }) => {
    const res = await request.get("/api/users/me");
    expect(res.ok()).toBeTruthy();
  });
});

test.describe("authenticated as admin", () => {
  test.skip(!process.env.PLAYWRIGHT_ADMIN_STATE, "no PLAYWRIGHT_ADMIN_STATE — skipping");
  test.use({ storageState: process.env.PLAYWRIGHT_ADMIN_STATE });

  test("GET /admin renders the admin dashboard without infinite redirect", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/admin/);
    // Either the breadcrumb "Admin" or the dashboard KPI tiles should
    // be visible. Loose check by design.
    const adminMarker = page.getByText(/admin|dashboard/i).first();
    await expect(adminMarker).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("sign-out flow", () => {
  test.skip(!process.env.PLAYWRIGHT_USER_STATE, "no PLAYWRIGHT_USER_STATE — skipping");
  test.use({ storageState: process.env.PLAYWRIGHT_USER_STATE });

  test("clicking Sign out clears session and survives reload", async ({ page, context }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /account menu|avatar/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();

    // Sign-out route bounces through /sign-out (own ClerkProvider)
    // and lands on /.
    await page.waitForURL("/", { timeout: 10_000 });
    await expect(page.getByRole("button", { name: /login|sign in/i }).first()).toBeVisible({
      timeout: 5_000,
    });

    // Reload — still signed out.
    await page.reload();
    await expect(page.getByRole("button", { name: /login|sign in/i }).first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
