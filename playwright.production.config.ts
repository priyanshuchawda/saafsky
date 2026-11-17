import config from "./playwright.config";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  ...config,
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
