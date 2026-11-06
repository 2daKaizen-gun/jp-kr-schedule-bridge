import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 3100;
const FIXTURE_PORT = 4010;

export default defineConfig({
  testDir: "e2e",
  testMatch: /.*\.e2e\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // 로컬에서는 설치된 Chrome을 쓰고, CI에서는 Playwright가 내려받은 Chromium을 사용
      use: { ...devices["Desktop Chrome"], ...(process.env.CI ? {} : { channel: "chrome" }) },
    },
  ],
  webServer: [
    {
      command: "node e2e/holiday-server.mjs",
      url: `http://localhost:${FIXTURE_PORT}/health`,
      env: { FIXTURE_PORT: String(FIXTURE_PORT) },
      reuseExistingServer: false,
    },
    {
      // 공휴일은 고정 데이터 서버에서 받고, Gemini 키는 비워 실제 AI를 호출하지 않음
      command: `npm run build && npm run start -- -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        GOOGLE_CALENDAR_API_KEY: "e2e",
        GOOGLE_CALENDAR_API_BASE: `http://localhost:${FIXTURE_PORT}/calendar/v3`,
        GEMINI_API_KEY: "",
      },
    },
  ],
});
