import { test, expect } from "@playwright/test";
import { loginAs, idFromDetailUrl, uniqueTitle } from "./helpers";

test.describe("إدارة المشاريع", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "officer");
  });

  test("إنشاء مشروع بحقوله الديناميكية وعرضه وتعديله", async ({ page }) => {
    const title = uniqueTitle("مشروع اختبار");

    await page.goto("/projects/new");
    await page.fill("input[name=title]", title);
    await page.selectOption("select[name=category]", "تعليمي");
    await page.fill("textarea[name=problemStatement]", "مشكلة اختبارية موثّقة للتحقق الآلي.");
    await page.fill("textarea[name=generalObjective]", "هدف عام اختباري.");
    await page.fill("input[name=beneficiaryCount]", "42");
    await page.fill("input[name=budgetTotal]", "50000");

    // إضافة هدف تفصيلي عبر الحقل الديناميكي
    await page.click('button:has-text("إضافة عنصر")');
    await page.locator('input[placeholder="هدف تفصيلي قابل للقياس"]').first().fill("هدف تفصيلي أول");

    await page.click('button[type=submit]:has-text("حفظ المشروع")');
    const projectId = await idFromDetailUrl(page, "projects");
    expect(projectId).toBeTruthy();

    await expect(page.locator("h1")).toContainText(title);
    await expect(page.getByText("مشكلة اختبارية موثّقة للتحقق الآلي.")).toBeVisible();
    await expect(page.getByText("هدف تفصيلي أول")).toBeVisible();

    // التعديل
    await page.click('a:has-text("تعديل")');
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/edit$`));
    const updatedTitle = `${title} (معدَّل)`;
    await page.fill("input[name=title]", updatedTitle);
    await page.click('button[type=submit]:has-text("حفظ التعديلات")');
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
    await expect(page.locator("h1")).toContainText(updatedTitle);
  });

  test("تكرار مشروع ينشئ نسخة مسودة جديدة مرتبطة بالأصل", async ({ page }) => {
    const title = uniqueTitle("مشروع للتكرار");
    await page.goto("/projects/new");
    await page.fill("input[name=title]", title);
    await page.click('button[type=submit]:has-text("حفظ المشروع")');
    await idFromDetailUrl(page, "projects");

    await page.click('button:has-text("تكرار المشروع")');
    await page.waitForURL(/\/projects\/.+\/edit$/);
    const titleInput = page.locator("input[name=title]");
    await expect(titleInput).toHaveValue(`نسخة من ${title}`);
  });

  test("قائمة المشاريع تدعم البحث النصي", async ({ page }) => {
    const title = uniqueTitle("مشروع قابل للبحث");
    await page.goto("/projects/new");
    await page.fill("input[name=title]", title);
    await page.click('button[type=submit]:has-text("حفظ المشروع")');
    await idFromDetailUrl(page, "projects");

    await page.goto("/projects");
    await page.fill('input[name=q]', title);
    await page.click('button:has-text("تصفية")');
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

});

test("المراجع لا يستطيع إنشاء مشروع جديد", async ({ page }) => {
  await loginAs(page, "reviewer");
  await page.goto("/projects/new");
  await page.waitForURL("**/projects");
  await expect(page.locator('a:has-text("مشروع جديد")')).toHaveCount(0);
});
