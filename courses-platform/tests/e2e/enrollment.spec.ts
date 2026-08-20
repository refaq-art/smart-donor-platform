import { test, expect } from "@playwright/test";
import { loginAs, USER_EMAIL, USER_PASSWORD } from "./helpers";

// دورة لم يُسجَّل بها المستخدم التجريبي مسبقًا في بيانات البذر (راجع prisma/seed.ts)
const FRESH_COURSE_TITLE = "بناء واجهات المستخدم باستخدام React";

test.describe("التسجيل في الدورات", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.waitForURL("**/account/my-courses");
  });

  test("يمكن للمستخدم التسجيل في دورة متاحة ومتابعتها من صفحة دوراتي", async ({ page }) => {
    await page.goto(`/courses?q=${encodeURIComponent(FRESH_COURSE_TITLE)}`);
    await page.getByRole("link", { name: FRESH_COURSE_TITLE }).click();
    await page.waitForURL("**/courses/**");

    await expect(page.getByText("التسجيل مفتوح")).toBeVisible();
    await page.click('button:has-text("سجّل الآن")');

    // بعد التسجيل تتحول الواجهة مباشرة إلى الحالة الدائمة "أنت مسجَّل" (بدل عرض
    // رسالة نجاح عابرة)، لذا نتحقق من الحالة النهائية المستقرة مباشرة.
    await expect(page.getByText("أنت مسجَّل في هذه الدورة ✓")).toBeVisible();

    await page.goto("/account/my-courses");
    await expect(page.getByText(FRESH_COURSE_TITLE).first()).toBeVisible();
  });

  test("لا يمكن التسجيل في نفس الدورة مرتين", async ({ page }) => {
    await page.goto(`/courses?q=${encodeURIComponent(FRESH_COURSE_TITLE)}`);
    await page.getByRole("link", { name: FRESH_COURSE_TITLE }).click();
    await page.waitForURL("**/courses/**");

    // ننتظر استقرار الصفحة على إحدى الحالتين المحتملتين أولًا حتى لا يُقرأ الـ DOM
    // قبل اكتمال العرض (سباق بين hydration والتحقق الفوري isVisible).
    await expect(
      page.getByText("أنت مسجَّل في هذه الدورة ✓").or(page.getByRole("button", { name: "سجّل الآن" }))
    ).toBeVisible();

    // بعد الاختبار السابق يُفترض أن يكون المستخدم مسجَّلًا بالفعل؛ لو لم يكن (تشغيل منفرد) نسجّله الآن
    const alreadyEnrolled = await page.getByText("أنت مسجَّل في هذه الدورة ✓").isVisible();
    if (!alreadyEnrolled) {
      await page.click('button:has-text("سجّل الآن")');
      await expect(page.getByText("أنت مسجَّل في هذه الدورة ✓")).toBeVisible();
    }

    // لا يوجد زر "سجّل الآن" ظاهر بعد التسجيل — فقط خيار الإلغاء
    await expect(page.locator('button:has-text("سجّل الآن")')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "إلغاء التسجيل" })).toBeVisible();
  });

  test("إلغاء التسجيل يعيد الدورة إلى حالة متاحة للتسجيل من جديد", async ({ page }) => {
    await page.goto("/account/my-courses");

    const card = page.locator(".card", { hasText: FRESH_COURSE_TITLE }).first();
    page.once("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: "إلغاء التسجيل" }).click();

    // بعد الإلغاء تُزال الدورة من قائمة "دوراتي" النشطة بالكامل (تحديث الصفحة عبر
    // revalidatePath)، فالتحقق الموثوق هو زوال البطاقة نفسها من الصفحة.
    await expect(page.locator(".card", { hasText: FRESH_COURSE_TITLE })).toHaveCount(0);

    // وللتأكد أن المقعد فعليًا عاد متاحًا: صفحة تفاصيل الدورة تُظهر "التسجيل مفتوح" من جديد
    await page.goto(`/courses?q=${encodeURIComponent(FRESH_COURSE_TITLE)}`);
    await page.getByRole("link", { name: FRESH_COURSE_TITLE }).click();
    await page.waitForURL("**/courses/**");
    await expect(page.getByText("التسجيل مفتوح")).toBeVisible();
  });
});
