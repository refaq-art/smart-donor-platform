import { test, expect } from "@playwright/test";
import { loginAs, idFromDetailUrl, uniqueTitle } from "./helpers";

test.describe("الجهات المانحة وفرص التمويل", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "officer");
  });

  test("إنشاء جهة مانحة وعرض بياناتها", async ({ page }) => {
    const name = uniqueTitle("جهة اختبار");
    await page.goto("/donors/new");
    await page.fill("input[name=name]", name);
    await page.selectOption("select[name=type]", "شركة");
    await page.fill("input[name=supportFields]", "تعليمي، تقني");
    await page.fill("input[name=email]", "test-donor@example.org");
    await page.click('button[type=submit]:has-text("حفظ الجهة")');

    const donorId = await idFromDetailUrl(page, "donors");
    expect(donorId).toBeTruthy();
    await expect(page.locator("h1")).toContainText(name);
    await expect(page.getByText("تعليمي، تقني")).toBeVisible();
  });

  test("إنشاء فرصة تمويل مرتبطة بمشروع وجهة مانحة، وتظهر في صفحتيهما", async ({ page }) => {
    const projectTitle = uniqueTitle("مشروع لفرصة");
    await page.goto("/projects/new");
    await page.fill("input[name=title]", projectTitle);
    await page.click('button[type=submit]:has-text("حفظ المشروع")');
    const projectId = await idFromDetailUrl(page, "projects");

    const donorName = uniqueTitle("جهة لفرصة");
    await page.goto("/donors/new");
    await page.fill("input[name=name]", donorName);
    await page.click('button[type=submit]:has-text("حفظ الجهة")');
    const donorId = await idFromDetailUrl(page, "donors");

    const oppTitle = uniqueTitle("فرصة اختبار");
    await page.goto(`/opportunities/new?projectId=${projectId}`);
    await page.fill("input[name=title]", oppTitle);
    await page.selectOption("select[name=donorId]", donorId);
    await page.fill("input[name=expectedAmount]", "75000");
    await page.fill("input[name=deadline]", "2026-12-31");
    await page.click('button[type=submit]:has-text("حفظ الفرصة")');

    const oppId = await idFromDetailUrl(page, "opportunities");
    expect(oppId).toBeTruthy();
    await expect(page.locator("h1")).toContainText(oppTitle);

    await page.goto(`/projects/${projectId}`);
    await expect(page.getByText(oppTitle)).toBeVisible();

    await page.goto(`/donors/${donorId}`);
    await expect(page.getByText(oppTitle)).toBeVisible();
  });

  test("قائمة فرص التمويل تدعم التصفية حسب الحالة", async ({ page }) => {
    await page.goto("/opportunities?status=مغلقة");
    await expect(page.locator("select[name=status]")).toHaveValue("مغلقة");
    const badges = page.locator('span:has-text("مغلقة")');
    await expect(badges.first()).toBeVisible();
  });
});
