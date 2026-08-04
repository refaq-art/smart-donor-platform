import { test, expect } from "@playwright/test";
import { loginAs, uniqueTitle } from "./helpers";

test.describe("إدارة المستخدمين (مدير النظام)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/settings/users");
  });

  test("إضافة مستخدم جديد يظهر في القائمة فورًا", async ({ page }) => {
    const name = uniqueTitle("مستخدم اختبار");
    const email = `${Date.now()}@test-example.org`;

    await page.fill('form:has-text("إضافة مستخدم جديد") input[name=name]', name);
    await page.fill('form:has-text("إضافة مستخدم جديد") input[name=email]', email);
    await page.fill('form:has-text("إضافة مستخدم جديد") input[name=password]', "Passw0rd!");
    await page.click('button[type=submit]:has-text("إضافة المستخدم")');

    await expect(page.getByText("تم إضافة المستخدم بنجاح")).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("لا يمكن للمدير حذف حسابه الحالي (لا يظهر زر الحذف بجانب اسمه)", async ({ page }) => {
    const currentUserRow = page.locator("tr", { hasText: "(أنت)" });
    await expect(currentUserRow.locator("button")).toHaveCount(0);
  });
});
