import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("التقارير", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "manager");
    await page.goto("/reports");
  });

  test("التنقل بين التقارير يعرض جدولًا مطابقًا لكل تقرير", async ({ page }) => {
    await expect(page.locator("h2")).toContainText("تقرير المشاريع");

    await page.click('button:has-text("تقرير فرص التمويل")');
    await expect(page.locator("h2")).toContainText("تقرير فرص التمويل");

    await page.click('button:has-text("تقرير نسب القبول")');
    await expect(page.locator("h2")).toContainText("تقرير نسب القبول");
    await expect(page.getByText("نسبة القبول")).toBeVisible();
  });

  test("زر تصدير CSV ينزّل ملفًا", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("تصدير CSV")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
