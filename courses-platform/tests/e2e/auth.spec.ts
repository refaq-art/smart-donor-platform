import { test, expect } from "@playwright/test";
import { loginAs, USER_EMAIL, USER_PASSWORD, uniqueEmail } from "./helpers";

test.describe("المصادقة", () => {
  test("زائر غير مسجَّل يُعاد توجيهه لتسجيل الدخول عند محاولة فتح صفحة محمية", async ({ page }) => {
    await page.goto("/account/my-courses");
    await page.waitForURL("**/login**");
    await expect(page.locator("h1")).toContainText("تسجيل الدخول");
  });

  test("إنشاء حساب جديد يسجّل الدخول تلقائيًا ويوجّه لدوراتي", async ({ page }) => {
    const email = uniqueEmail("newlearner");

    await page.goto("/register");
    await page.fill("#fullName", "متعلم جديد للاختبار");
    await page.fill("#email", email);
    await page.fill("#password", "TestPass123");
    await page.click('button[type=submit]');

    await page.waitForURL("**/account/my-courses");
    await expect(page.locator("h1")).toContainText("متعلم جديد للاختبار");
  });

  test("لا يمكن إنشاء حساب ببريد مسجَّل مسبقًا", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#fullName", "مستخدم مكرر");
    await page.fill("#email", USER_EMAIL);
    await page.fill("#password", "AnotherPass123");
    await page.click('button[type=submit]');

    await expect(page.getByText("يوجد حساب مسجَّل بهذا البريد")).toBeVisible();
  });

  test("تسجيل الدخول ببيانات خاطئة يُظهر رسالة خطأ واضحة", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", USER_EMAIL);
    await page.fill("#password", "wrong-password");
    await page.click('button[type=submit]');

    await expect(page.getByText("البريد الإلكتروني أو كلمة المرور غير صحيحة")).toBeVisible();
  });

  test("تسجيل الدخول والخروج للمستخدم التجريبي", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL("**/account/my-courses");

    await page.click("text=مستخدم تجريبي");
    await page.click('button:has-text("تسجيل الخروج")');
    await page.waitForURL("/");
    await expect(page.locator("text=تسجيل الدخول").first()).toBeVisible();
  });
});
