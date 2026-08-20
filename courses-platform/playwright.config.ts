import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // الاختبارات تشترك في نفس قاعدة البيانات، لذا تُنفَّذ تباعًا لتفادي التعارض
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // في بيئات لديها متصفح Chromium مثبَّت مسبقًا خارج المسار الافتراضي لـ Playwright
    // (مثل بيئات CI الجاهزة)، يمكن تمرير مسار الملف التنفيذي عبر هذا المتغير
    // بدلاً من تعديل هذا الملف. عند وجود نسخة Chromium أحدث لم تعد تدعم وضع
    // headless القديم، نمرّر headless=new صراحة عبر args بدل الاعتماد على
    // العلم الافتراضي الذي يُضيفه Playwright تلقائيًا.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
          headless: false,
          args: ["--headless=new", "--no-sandbox"],
        }
      : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run db:reset && npm run dev -- -p 3200",
    url: `${BASE_URL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
