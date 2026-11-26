import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "browser-compat.spec.ts",
  // Keep navigation smoke tests serial against the shared production server;
  // this avoids transient cross-engine load contention obscuring route checks.
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: { baseURL: "http://localhost:3100" },
  projects: [
    { name: "chromium", use: devices["Desktop Chrome"] },
    { name: "firefox", use: devices["Desktop Firefox"] },
    { name: "webkit", use: devices["Desktop Safari"] },
  ],
  webServer: {
    command: "node ./node_modules/next/dist/bin/next start --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
