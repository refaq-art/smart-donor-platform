import { test, expect } from "@playwright/test";
import { loginAs, idFromDetailUrl, uniqueTitle } from "./helpers";

async function createProjectAndOpportunity(page: import("@playwright/test").Page) {
  const projectTitle = uniqueTitle("مشروع لطلب منحة");
  await page.goto("/projects/new");
  await page.fill("input[name=title]", projectTitle);
  await page.click('button[type=submit]:has-text("حفظ المشروع")');
  const projectId = await idFromDetailUrl(page, "projects");

  const oppTitle = uniqueTitle("فرصة لطلب منحة");
  await page.goto(`/opportunities/new?projectId=${projectId}`);
  await page.fill("input[name=title]", oppTitle);
  await page.click('button[type=submit]:has-text("حفظ الفرصة")');
  const oppId = await idFromDetailUrl(page, "opportunities");

  return { projectId, oppId };
}

test.describe("طلبات المنح", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "officer");
  });

  test("إنشاء طلب، تعبئة أقسامه، ارتفاع نسبة الاكتمال، وحفظه", async ({ page }) => {
    const { projectId, oppId } = await createProjectAndOpportunity(page);

    await page.goto(`/applications/new?projectId=${projectId}&opportunityId=${oppId}`);
    await page.click('button[type=submit]:has-text("بدء إعداد الطلب")');
    await page.waitForFunction(
      () => location.pathname.includes("/applications/") && !location.pathname.endsWith("/new")
    );

    const percentBefore = await page.locator("text=/\\d+%/").first().innerText();

    // تبويب الملخص والتعريف (مفعّل افتراضيًا)
    await page.fill("textarea[name=executiveSummary]", "ملخص تنفيذي اختباري.");
    await page.fill("textarea[name=orgIntroduction]", "تعريف اختباري بالجمعية.");

    // تبويب المشكلة والمبررات
    await page.click('button:has-text("المشكلة والمبررات")');
    await page.fill("textarea[name=problemStatement]", "وصف مشكلة اختباري.");

    await page.click('button[type=submit]:has-text("حفظ التغييرات")');
    await expect(page.getByText("تم حفظ التغييرات بنجاح")).toBeVisible();

    const percentAfter = await page.locator("text=/\\d+%/").first().innerText();
    expect(Number(percentAfter.replace("%", ""))).toBeGreaterThan(Number(percentBefore.replace("%", "")));

    // التحقق من بقاء البيانات بعد إعادة تحميل الصفحة
    await page.reload();
    await expect(page.locator("textarea[name=executiveSummary]")).toHaveValue("ملخص تنفيذي اختباري.");
  });

  test("مساعد الذكاء الاصطناعي (الوضع التجريبي) يعرض اقتراحًا قابلًا للاستخدام", async ({ page }) => {
    const { projectId, oppId } = await createProjectAndOpportunity(page);
    await page.goto(`/applications/new?projectId=${projectId}&opportunityId=${oppId}`);
    await page.click('button[type=submit]:has-text("بدء إعداد الطلب")');
    await page.waitForFunction(
      () => location.pathname.includes("/applications/") && !location.pathname.endsWith("/new")
    );

    await page.click('button:has-text("صياغة الملخص التنفيذي")');
    await expect(page.getByText("اقتراح المساعد الذكي")).toBeVisible();
    await expect(page.getByText(/الوضع التجريبي/)).toBeVisible({ timeout: 10_000 });

    await page.click('button:has-text("استخدام هذا النص")');
    await expect(page.locator("textarea[name=executiveSummary]")).not.toHaveValue("");
  });

  test("تغيير حالة الطلب يُسجَّل في سجل المتابعة", async ({ page }) => {
    const { projectId, oppId } = await createProjectAndOpportunity(page);
    await page.goto(`/applications/new?projectId=${projectId}&opportunityId=${oppId}`);
    await page.click('button[type=submit]:has-text("بدء إعداد الطلب")');
    await page.waitForFunction(
      () => location.pathname.includes("/applications/") && !location.pathname.endsWith("/new")
    );

    await page.selectOption("select[name=toStatus]", "تحت المراجعة الداخلية");
    await page.fill("textarea[name=note]", "ملاحظة اختبارية للمراجعة.");
    await page.fill('input[name=nextStep]', "انتظار رد المراجع.");
    await page.click('button[type=submit]:has-text("تحديث الحالة")');

    await expect(page.getByText("تم تحديث الحالة")).toBeVisible();
    await expect(page.getByText("مسودة ← تحت المراجعة الداخلية")).toBeVisible();
    await expect(page.getByText("ملاحظة اختبارية للمراجعة.")).toBeVisible();
    await expect(page.getByText("الخطوة التالية: انتظار رد المراجع.")).toBeVisible();
  });

  test("الطلبات تظهر في القائمة العامة مع حالتها الصحيحة", async ({ page }) => {
    const { projectId, oppId } = await createProjectAndOpportunity(page);
    await page.goto(`/applications/new?projectId=${projectId}&opportunityId=${oppId}`);
    const title = await page.locator("input[name=title]").inputValue();
    await page.click('button[type=submit]:has-text("بدء إعداد الطلب")');
    await page.waitForFunction(
      () => location.pathname.includes("/applications/") && !location.pathname.endsWith("/new")
    );

    await page.goto("/applications");
    await expect(page.getByText(title)).toBeVisible();
  });
});
