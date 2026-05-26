import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the stabilization e2e suite.
 *
 * Default baseURL is production. Override with PLAYWRIGHT_BASE_URL for
 * a staging/local run. Single worker because the auth tests mutate
 * shared Clerk + Mongo state — parallelizing causes flake.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://www.internetkeeda.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
