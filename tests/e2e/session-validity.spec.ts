import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./helpers";

const prisma = new PrismaClient();

/**
 * تغطية لثغرة حقيقية ظهرت في الإنتاج: عندما تصبح جلسة المستخدم غير صالحة
 * (حساب مُعطَّل، أو تغيّرت جمعيته) أثناء تصفحه، يجب أن يُعاد توجيهه لصفحة
 * الدخول بهدوء — وليس أن يتحطم الخادم بمحاولة حذف كعكة الجلسة من داخل مكوّن
 * خادم أثناء العرض (خطأ Next.js: "Cookies can only be modified in a Server
 * Action or Route Handler").
 */
test.describe("صلاحية الجلسة", () => {
  test("تعطيل حساب المستخدم أثناء الجلسة يعيد توجيهه لصفحة الدخول دون تحطم الخادم", async ({ page }) => {
    await loginAs(page, "reviewer");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("مرحبًا");

    const user = await prisma.user.findFirstOrThrow({ where: { email: "reviewer@refaq.org" } });
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

    try {
      const res = await page.goto("/dashboard");
      // يجب أن يُعاد التوجيه لصفحة الدخول (وليس خطأ 500)
      expect(page.url()).toContain("/login");
      expect(res?.status()).toBeLessThan(500);
      await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
      await expect(page.getByText(/Application error/i)).toHaveCount(0);
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: { isActive: true } });
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
