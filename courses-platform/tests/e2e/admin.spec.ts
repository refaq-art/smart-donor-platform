import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAs, USER_EMAIL, USER_PASSWORD } from "./helpers";

test.describe("صلاحيات لوحة الإدارة", () => {
  test("زائر غير مسجَّل يُعاد توجيهه لتسجيل الدخول عند فتح لوحة الإدارة", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login**");
  });

  test("مستخدم عادي (غير مسؤول) لا يستطيع الوصول للوحة الإدارة", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL("**/account/my-courses");

    await page.goto("/admin");
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("المسؤول يصل للوحة التحكم ويشاهد الإحصائيات", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");

    await expect(page.locator("h1")).toContainText("لوحة التحكم");
    await expect(page.getByText("إجمالي المستخدمين")).toBeVisible();
    await expect(page.getByText("إجمالي الدورات")).toBeVisible();
    await expect(page.getByText("إجمالي التسجيلات")).toBeVisible();
  });
});

test.describe("إدارة الدورات من لوحة الإدارة", () => {
  test("المسؤول يستطيع إنشاء دورة جديدة ونشرها وتظهر في صفحة الدورات العامة", async ({ page }) => {
    await loginAsAdmin(page);

    const title = `دورة اختبار الإدارة ${Date.now()}`;
    await page.goto("/admin/courses/new");
    await page.fill("#title", title);
    await page.fill("#shortDescription", "وصف مختصر لدورة اختبار الإدارة الآلي.");
    await page.fill("#description", "وصف تفصيلي كافٍ الطول لاجتياز التحقق من صحة نموذج إنشاء الدورة.");
    await page.fill("#instructorName", "مدرب الاختبار");
    await page.fill("#providerName", "جهة الاختبار");
    await page.selectOption("#categoryId", { index: 1 });
    await page.fill("#startDate", "2026-11-01");
    await page.fill("#endDate", "2026-11-30");
    await page.fill("#scheduleTime", "الاثنين، 6 مساءً");
    await page.fill("#durationText", "3 أسابيع");
    await page.fill("#meetingUrl", "https://meet.example.com/admin-test");
    await page.fill("#totalSeats", "10");
    await page.click('button[type=submit]:has-text("إنشاء الدورة")');

    await page.waitForURL("**/admin/courses/**/edit?created=1");
    await expect(page.getByText("تم إنشاء الدورة بنجاح")).toBeVisible();

    // تظهر الآن في قائمة الإدارة
    await page.goto("/admin/courses");
    await expect(page.getByText(title)).toBeVisible();

    // وتظهر في صفحة الدورات العامة لأنها منشورة والتسجيل مفتوح افتراضيًا
    await page.goto("/courses");
    await page.fill("#q", title);
    await page.click('button:has-text("تطبيق")');
    await expect(page.getByText(title)).toBeVisible();
  });

  test("المسؤول يستطيع إخفاء دورة فتختفي من صفحة الدورات العامة", async ({ page }) => {
    await loginAsAdmin(page);

    const title = `دورة اختبار الإخفاء ${Date.now()}`;
    await page.goto("/admin/courses/new");
    await page.fill("#title", title);
    await page.fill("#shortDescription", "وصف مختصر لدورة اختبار الإخفاء.");
    await page.fill("#description", "وصف تفصيلي كافٍ الطول لاجتياز التحقق من صحة نموذج إنشاء الدورة.");
    await page.fill("#instructorName", "مدرب الاختبار");
    await page.fill("#providerName", "جهة الاختبار");
    await page.selectOption("#categoryId", { index: 1 });
    await page.fill("#startDate", "2026-11-01");
    await page.fill("#endDate", "2026-11-30");
    await page.fill("#scheduleTime", "الثلاثاء، 6 مساءً");
    await page.fill("#durationText", "3 أسابيع");
    await page.fill("#meetingUrl", "https://meet.example.com/admin-hide-test");
    await page.fill("#totalSeats", "10");
    await page.click('button[type=submit]:has-text("إنشاء الدورة")');
    await page.waitForURL("**/admin/courses/**/edit?created=1");

    await page.goto("/admin/courses");
    await page.fill('input[name="q"]', title);
    await page.click('button:has-text("بحث")');
    await page.click(`button:has-text("منشورة")`);
    await expect(page.getByRole("button", { name: "مخفية" })).toBeVisible();

    await page.goto("/courses");
    await page.fill("#q", title);
    await page.click('button:has-text("تطبيق")');
    await expect(page.getByText("لا توجد دورات مطابقة")).toBeVisible();
  });
});

test.describe("إدارة المستخدمين والتسجيلات من لوحة الإدارة", () => {
  test("المسؤول يشاهد قائمة المستخدمين مع عدد دوراتهم", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/users");

    await expect(page.locator("h1")).toContainText("إدارة المستخدمين");
    await expect(page.getByText("مستخدم تجريبي")).toBeVisible();
  });

  test("المسؤول يشاهد قائمة التسجيلات ويستطيع إلغاء تسجيل", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/enrollments");

    await expect(page.locator("h1")).toContainText("إدارة التسجيلات");

    // نُصفِّي على دورة لا يعتمد أي اختبار آخر على عدد مقاعدها المتبقية، لتفادي
    // أي تأثير جانبي على اختبارات اكتمال المقاعد أو التسجيل الأخرى.
    await page.fill('input[name="q"]', "اللغة الإنجليزية للمحادثة اليومية");
    await page.click('button:has-text("تطبيق الفلاتر")');

    const firstCancelButton = page.getByRole("button", { name: "إلغاء التسجيل" }).first();
    await expect(firstCancelButton).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await firstCancelButton.click();

    await expect(page.getByText("ملغى (بواسطة الإدارة)").first()).toBeVisible();
  });
});
