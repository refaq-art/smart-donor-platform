import { test, expect } from "@playwright/test";
import { loginAs, USER_EMAIL, USER_PASSWORD } from "./helpers";

// دورة مُعبَّأة بالكامل في بيانات البذر (totalSeats = fillerEnrollCount = 8، راجع prisma/seed.ts)
const FULL_COURSE_TITLE = "مقدمة في تحليل البيانات باستخدام Python وPandas";

test.describe("منع التسجيل عند اكتمال المقاعد", () => {
  test("زر التسجيل يظهر معطَّلًا وبرسالة اكتمال المقاعد لدورة ممتلئة", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL("**/account/my-courses");

    await page.goto("/courses");
    await page.getByRole("link", { name: FULL_COURSE_TITLE }).click();
    await page.waitForURL("**/courses/**");

    await expect(page.getByText("المقاعد مكتملة").first()).toBeVisible();
    // لا يوجد زر تسجيل فعّال قابل للنقر لهذه الدورة
    await expect(page.locator('button:has-text("سجّل الآن")')).toHaveCount(0);
  });
});
