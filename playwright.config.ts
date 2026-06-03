import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1920, height: 1080 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
