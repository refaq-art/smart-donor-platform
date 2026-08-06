import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("اكتشاف المانحين الآلي", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "officer");
  });

  test("تعرض المقترحات التجريبية المزروعة مع المشروع المقترح", async ({ page }) => {
    await page.goto("/donors");
    await expect(page.getByText("مانحون مقترَحون")).toBeVisible();
    await expect(page.getByText("مؤسسة الرواد الخيرية (مثال توضيحي)")).toBeVisible();
    await expect(page.getByText(/مشروع مقترح للرفع له/)).toBeVisible();
  });

  test("تشغيل البحث يدويًا يضيف مقترحًا جديدًا (الوضع التجريبي)", async ({ page }) => {
    await page.goto("/donors");
    await page.click('button:has-text("تشغيل البحث الآن")');
    await expect(page.getByText(/تم فحص \d+ نتيجة/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/جهة تجريبية \(Mock\)/).first()).toBeVisible();
  });

  test("إضافة مقترح كمانح فعلي يزيله من قائمة المقترحات ويُنشئ سجل مانح", async ({ page }) => {
    await page.goto("/donors");
    const leadItem = page.locator("li", { hasText: "برنامج دعم المبادرات المجتمعية" });
    await leadItem.getByRole("button", { name: "إضافة كمانح" }).click();
    await leadItem.getByRole("button", { name: "تأكيد الإضافة كمانح" }).click();
    // ينتظر السيرفر أكشن إتمام العملية ثم إغلاق النموذج (يؤكد اكتمال الإضافة فعليًا)
    await expect(leadItem.getByRole("button", { name: "تأكيد الإضافة كمانح" })).toHaveCount(0);

    await page.goto("/donors");
    await expect(page.locator("li", { hasText: "برنامج دعم المبادرات المجتمعية" })).toHaveCount(0);
    await expect(page.getByText("برنامج دعم المبادرات المجتمعية (مثال توضيحي)").first()).toBeVisible();
  });

  test("تجاهل مقترح يزيله من القائمة", async ({ page }) => {
    await page.goto("/donors");
    const leadItem = page.locator("li", { hasText: "مؤسسة الرواد الخيرية" });
    page.once("dialog", (d) => d.accept());
    await leadItem.getByRole("button", { name: "تجاهل" }).click();
    await expect(page.getByText("مؤسسة الرواد الخيرية (مثال توضيحي)")).toHaveCount(0);
  });
});
