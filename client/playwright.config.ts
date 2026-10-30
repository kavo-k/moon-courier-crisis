import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: "list",
  outputDir: "test-results",
  globalTeardown: "./e2e/teardown.ts",
  use: {
    ...devices["Desktop Edge"],
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
    headless: true,
    baseURL: "http://127.0.0.1:3101",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm --prefix ../server run test:serve",
    url: "http://127.0.0.1:3101/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
