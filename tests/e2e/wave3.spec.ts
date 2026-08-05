import { test, expect } from "@playwright/test";
import { loginAs, idFromDetailUrl, uniqueTitle } from "./helpers";

async function createProjectAndApplication(page: import("@playwright/test").Page) {
  const projectTitle = uniqueTitle("مشروع للمراجعة والتصدير");
  await page.goto("/projects/new");
  await page.fill("input[name=title]", projectTitle);
  await page.click('button[type=submit]:has-text("حفظ المشروع")');
  const projectId = await idFromDetailUrl(page, "projects");

  await page.goto(`/applications/new?projectId=${projectId}`);
  await page.click('button[type=submit]:has-text("بدء إعداد الطلب")');
  await page.waitForFunction(
    () => location.pathname.includes("/applications/") && !location.pathname.endsWith("/new")
  );
  const appId = await idFromDetailUrl(page, "applications");
  return { projectId, appId };
}

test.describe("ملاحظات المراجعة وسجل الإصدارات والتصدير", () => {
  test("مسؤول المنح يضيف ملاحظة، والمراجع يضيف طلب تعديل ويغلقه", async ({ page }) => {
    await loginAs(page, "officer");
    const { appId } = await createProjectAndApplication(page);

    await page.fill("textarea[name=body]", "ملاحظة عامة تجريبية من مسؤول المنح.");
    await page.click('button[type=submit]:has-text("إضافة الملاحظة")');
    await expect(page.getByText("ملاحظة عامة تجريبية من مسؤول المنح.")).toBeVisible();

    await page.goto("/dashboard");
    await page.click('button:has-text("تسجيل الخروج")');
    await page.waitForURL("**/login");

    await loginAs(page, "reviewer");
    await page.goto(`/applications/${appId}`);
    await page.selectOption('select[name=kind]', "CHANGE_REQUEST");
    await page.fill("textarea[name=body]", "الرجاء استكمال الملخص التنفيذي قبل الإرسال.");
    await page.click('button[type=submit]:has-text("إضافة الملاحظة")');
    await expect(page.locator("span", { hasText: "طلب تعديل" })).toBeVisible();
    await expect(page.getByText("الرجاء استكمال الملخص التنفيذي قبل الإرسال.")).toBeVisible();

    await page.locator('button:has-text("وضع علامة معالَجة")').first().click();
    await page.click('button:has-text("الكل")');
    await expect(page.getByText("إعادة الفتح").first()).toBeVisible();
  });

  test("حفظ محتوى الطلب ينشئ إصدارًا في السجل، ويمكن مقارنته", async ({ page }) => {
    await loginAs(page, "officer");
    await createProjectAndApplication(page);

    await page.fill("textarea[name=executiveSummary]", "نص أول للملخص التنفيذي.");
    await page.click('button[type=submit]:has-text("حفظ التغييرات")');
    await expect(page.getByText("تم حفظ التغييرات بنجاح")).toBeVisible();

    await page.fill("textarea[name=executiveSummary]", "نص معدَّل ثانٍ للملخص التنفيذي.");
    await page.click('button[type=submit]:has-text("حفظ التغييرات")');
    await expect(page.getByText("تم حفظ التغييرات بنجاح")).toBeVisible();

    // إعادة تحميل لضمان انعكاس آخر لقطة محفوظة والمحتوى الحالي في خصائص لوحة الإصدارات
    await page.reload();
    await expect(page.getByText("لقطة تلقائية").first()).toBeVisible();
    await page.getByRole("button", { name: "مقارنة", exact: true }).first().click();
    await expect(page.getByText("مقارنة الإصدار المحفوظ بالمحتوى الحالي")).toBeVisible();
    await expect(page.getByText("نص أول للملخص التنفيذي.")).toBeVisible();
    await expect(page.locator("p.text-emerald-700", { hasText: "نص معدَّل ثانٍ للملخص التنفيذي." })).toBeVisible();
  });

  test("روابط تصدير Word وExcel والطباعة متاحة وتعمل", async ({ page, request, baseURL }) => {
    await loginAs(page, "officer");
    const { appId } = await createProjectAndApplication(page);

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const docxRes = await request.get(`${baseURL}/api/applications/${appId}/export/docx`, {
      headers: { cookie: cookieHeader },
    });
    expect(docxRes.status()).toBe(200);
    expect(docxRes.headers()["content-type"]).toContain("wordprocessingml");

    const xlsxRes = await request.get(`${baseURL}/api/applications/${appId}/export/budget-xlsx`, {
      headers: { cookie: cookieHeader },
    });
    expect(xlsxRes.status()).toBe(200);
    expect(xlsxRes.headers()["content-type"]).toContain("spreadsheetml");

    await page.goto(`/applications/${appId}/print`);
    await expect(page.getByText("طباعة / حفظ كـ PDF")).toBeVisible();
  });
});
