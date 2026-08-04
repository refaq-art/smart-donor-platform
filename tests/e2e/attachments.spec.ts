import { test, expect } from "@playwright/test";
import { loginAs, idFromDetailUrl, uniqueTitle } from "./helpers";

// أصغر ملف PNG صالح (1×1 بكسل شفاف) — يُستخدم للتحقق من رفع المرفقات دون الحاجة لملف ثنائي في المستودع
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test.describe("رفع المرفقات", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "officer");
  });

  test("رفع صورة كمرفق لمشروع يظهر في قائمة المرفقات", async ({ page }) => {
    const title = uniqueTitle("مشروع بمرفق");
    await page.goto("/projects/new");
    await page.fill("input[name=title]", title);
    await page.click('button[type=submit]:has-text("حفظ المشروع")');
    await idFromDetailUrl(page, "projects");

    await page.setInputFiles('input[type=file][name=file]', {
      name: "test-attachment.png",
      mimeType: "image/png",
      buffer: Buffer.from(TINY_PNG_BASE64, "base64"),
    });
    await page.click('button:has-text("رفع الملف")');

    await expect(page.getByText("test-attachment.png")).toBeVisible();
  });

  test("رفض ملف بامتداد غير مدعوم مع رسالة خطأ عربية واضحة", async ({ page }) => {
    const title = uniqueTitle("مشروع لرفض المرفق");
    await page.goto("/projects/new");
    await page.fill("input[name=title]", title);
    await page.click('button[type=submit]:has-text("حفظ المشروع")');
    await idFromDetailUrl(page, "projects");

    await page.setInputFiles('input[type=file][name=file]', {
      name: "not-allowed.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("fake binary content"),
    });
    await page.click('button:has-text("رفع الملف")');

    await expect(page.getByText("نوع الملف غير مدعوم")).toBeVisible();
  });
});
