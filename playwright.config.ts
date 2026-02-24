import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test"), override: true });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    navigationTimeout: 60_000,
  },

  projects: [
    { name: "setup", testMatch: /global-setup\.ts/ },
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: /mobile\//,
    },
    {
      name: "Desktop Firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
      testIgnore: /mobile\//,
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
  },
});
