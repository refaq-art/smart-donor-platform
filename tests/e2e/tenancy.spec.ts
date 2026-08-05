import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * أهم اختبار أمني في المنصة: التأكد أن بيانات كل جمعية معزولة تمامًا.
 * البيانات التجريبية تُنشئ جمعية ثانية ("جمعية الأمل") بمستخدم خاص بها،
 * ويجب ألا يرى أي طرف بيانات الطرف الآخر — حتى عند تخمين الروابط مباشرة.
 */
test.describe("عزل بيانات الجمعيات", () => {
  test("مستخدم جمعية أخرى لا يرى مشاريع الجمعية الأولى في القوائم", async ({ page }) => {
    // مستخدم الجمعية الثانية
    await page.goto("/login");
    await page.fill("#email", "officer@amal.org");
    await page.fill("#password", "Passw0rd!");
    await page.click('button[type=submit]:has-text("تسجيل الدخول")');
    await page.waitForURL(/\/(dashboard|settings\/password)/);

    await page.goto("/projects");
    // مشروع من الجمعية الأولى يجب ألا يظهر إطلاقًا
    await expect(page.getByText("كفالة تعليم الأيتام")).toHaveCount(0);
    // بينما يظهر مشروع جمعيته هو
    await expect(page.getByText("مشروع جمعية الأمل").first()).toBeVisible();
  });

  test("الوصول المباشر لرابط سجل من جمعية أخرى يُرفض (404)", async ({ page, request }) => {
    // نلتقط معرّف مشروع من الجمعية الأولى
    await loginAs(page, "officer");
    await page.goto("/projects");
    const link = page.locator('a[href^="/projects/"]').first();
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    const foreignProjectPath = href!;

    // تسجيل الخروج ثم الدخول بمستخدم الجمعية الثانية
    await page.goto("/dashboard");
    await page.click('button:has-text("تسجيل الخروج")');
    await page.waitForURL("**/login");

    await page.fill("#email", "officer@amal.org");
    await page.fill("#password", "Passw0rd!");
    await page.click('button[type=submit]:has-text("تسجيل الدخول")');
    await page.waitForURL(/\/(dashboard|settings\/password)/);

    // محاولة فتح مشروع الجمعية الأخرى مباشرة
    const res = await page.goto(foreignProjectPath);
    expect(res?.status()).toBe(404);
  });

  test("قوائم المستخدمين لا تكشف مستخدمي جمعية أخرى", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@amal.org");
    await page.fill("#password", "Passw0rd!");
    await page.click('button[type=submit]:has-text("تسجيل الدخول")');
    await page.waitForURL(/\/(dashboard|settings\/password)/);

    await page.goto("/settings/users");
    await expect(page.getByText("officer@refaq.org")).toHaveCount(0);
    await expect(page.getByText("officer@amal.org").first()).toBeVisible();
  });
});
