import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scenarios",
  testMatch: "**/e2e.spec.mjs",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:8888",
    headless: true,
  },
  /* No automatic webServer — wp-env is managed externally. */
});
