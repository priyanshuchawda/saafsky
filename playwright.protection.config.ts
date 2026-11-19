import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/protection",
  use: { baseURL: "http://localhost:3101" },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next start --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SAAFSKY_PUBLIC: "true",
      VERCEL: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      RATE_LIMIT_HASH_SECRET: "",
      GEMINI_API_KEY: "",
    },
  },
});
