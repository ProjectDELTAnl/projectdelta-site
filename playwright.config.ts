import { defineConfig, devices } from "@playwright/test";

const includeWebKit =
  process.env.CI === "true" || process.env.DELTA_WEBKIT === "1";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
      testIgnore: /(cross-browser|hosting-policy)\.spec\.ts/,
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /cross-browser\.spec\.ts/,
    },
    ...(includeWebKit
      ? [
          {
            name: "webkit-desktop",
            use: { ...devices["Desktop Safari"] },
            testMatch: /cross-browser\.spec\.ts/,
          },
        ]
      : []),
  ],
});
