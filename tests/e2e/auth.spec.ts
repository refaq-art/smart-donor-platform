import { test, expect } from "@playwright/test";
import { loginAs, logout, ROLE_LABELS } from "./helpers";

test.describe("المصادقة والصلاحيات الأساسية", () => {
  test("زيارة صفحة محمية بدون تسجيل دخول تعيد التوجيه لصفحة الدخول", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**");
    await expect(page.locator("h1")).toContainText("تسجيل الدخول");
  });

  test("بيانات دخول خاطئة تُظهر رسالة خطأ ولا تُدخل المستخدم", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "officer@refaq.org");
    await page.fill("#password", "wrong-password");
    await page.click('button[type=submit]:has-text("تسجيل الدخول")');
    await expect(page.getByText("بيانات الدخول غير صحيحة")).toBeVisible();
    expect(page.url()).toContain("/login");
  });

  for (const role of Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]) {
    test(`تسجيل الدخول ناجح لحساب: ${ROLE_LABELS[role]}`, async ({ page }) => {
      await loginAs(page, role);
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  }

  test("تسجيل الخروج يعيد المستخدم لصفحة الدخول ويمنع الوصول للصفحات المحمية بعدها", async ({ page }) => {
    await loginAs(page, "officer");
    await logout(page);
    await page.goto("/projects");
    await page.waitForURL("**/login**");
  });

  test("المراجع لا يستطيع الوصول إلى إدارة المستخدمين ويُعاد توجيهه", async ({ page }) => {
    await loginAs(page, "reviewer");
    await page.goto("/settings/users");
    await page.waitForURL("**/dashboard");
  });

  test("مدير النظام يرى رابط إدارة المستخدمين والمراجع لا يراه", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page.locator('a:has-text("المستخدمون")')).toBeVisible();
    await logout(page);

    await loginAs(page, "reviewer");
    await expect(page.locator('a:has-text("المستخدمون")')).toHaveCount(0);
  });
});
