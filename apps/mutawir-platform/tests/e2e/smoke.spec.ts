import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3411";

test("org can log in and see dashboard", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", "org@mutawir.sa");
  await page.fill("#password", "Mutawir@2026");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/org$/);
  await expect(page.getByText("مرحبًا الجمعية النموذجية بحائل")).toBeVisible();
});

test("org can fill an indicator answer and see it persisted", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", "org@mutawir.sa");
  await page.fill("#password", "Mutawir@2026");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/org$/);
  await page.goto(`${BASE}/org/assessment/pre`);
  await expect(page.getByText("الاستبيان القبلي")).toBeVisible();

  const firstTextarea = page.locator("textarea[name=answerText]").first();
  await firstTextarea.fill("لدى الجمعية إجراءات موثقة وسياسات معتمدة للشراكات، مرفق دليل إجرائي معتمد من مجلس الإدارة.");
  await page.locator("form:has(textarea[name=answerText])").first().getByRole("button", { name: "حفظ كمسودة" }).click();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator("textarea[name=answerText]").first()).toHaveValue(/دليل إجرائي معتمد/);
});

test("consultant can log in and see portfolio", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", "consultant@mutawir.sa");
  await page.fill("#password", "Mutawir@2026");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/consultant$/);
  await expect(page.getByText("الجمعية النموذجية بحائل")).toBeVisible();
});

test("admin can log in and see framework", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", "admin@mutawir.sa");
  await page.fill("#password", "Mutawir@2026");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto(`${BASE}/admin/framework`);
  await expect(page.getByText("الشراكات والعلاقات").first()).toBeVisible();
});

test("council can log in and see executive dashboard", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", "council@mutawir.sa");
  await page.fill("#password", "Mutawir@2026");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/council$/);
  await expect(page.getByRole("heading", { name: "اللوحة الإشرافية لمجلس الجمعيات" })).toBeVisible();
});
