import { test, expect, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAsAdmin, uniqueEmail } from "./helpers";

const prisma = new PrismaClient();

test.describe("أمان التزامن عند حجز آخر مقعد", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("طلبان متزامنان على دورة بمقعد واحد فقط: ينجح أحدهما ويُرفض الآخر، ولا تتجاوز التسجيلات السعة", async ({
    browser,
  }) => {
    test.setTimeout(60_000);
    const contexts: BrowserContext[] = [];

    try {
      // 1) المسؤول ينشئ دورة بمقعد واحد فقط
      const adminContext = await browser.newContext();
      contexts.push(adminContext);
      const adminPage = await adminContext.newPage();
      await loginAsAdmin(adminPage);

      const title = `دورة اختبار التزامن ${Date.now()}`;
      await adminPage.goto("/admin/courses/new");
      await adminPage.fill("#title", title);
      await adminPage.fill("#shortDescription", "دورة تجريبية لاختبار حجز آخر مقعد بأمان تام.");
      await adminPage.fill(
        "#description",
        "وصف تفصيلي كافٍ لاجتياز التحقق من صحة النموذج ضمن اختبار التزامن الآلي."
      );
      await adminPage.fill("#instructorName", "مدرب الاختبار");
      await adminPage.fill("#providerName", "جهة الاختبار");
      await adminPage.selectOption("#categoryId", { index: 1 });
      await adminPage.fill("#startDate", "2026-12-01");
      await adminPage.fill("#endDate", "2026-12-20");
      await adminPage.fill("#scheduleTime", "الأحد، 7 مساءً");
      await adminPage.fill("#durationText", "أسبوعان");
      await adminPage.fill("#meetingUrl", "https://meet.example.com/race-test");
      await adminPage.fill("#totalSeats", "1");
      await adminPage.click('button[type=submit]:has-text("إنشاء الدورة")');
      await adminPage.waitForURL("**/admin/courses/**/edit?created=1");

      const course = await prisma.course.findFirst({ where: { title } });
      expect(course).not.toBeNull();
      expect(course!.remainingSeats).toBe(1);

      // 2) إنشاء متسابقَين (مستخدمَين جديدَين) في سياقَي متصفح منفصلَين تمامًا
      const contextA = await browser.newContext();
      contexts.push(contextA);
      const pageA = await contextA.newPage();
      await pageA.goto("/register");
      await pageA.fill("#fullName", "متسابق أ");
      await pageA.fill("#email", uniqueEmail("racer-a"));
      await pageA.fill("#password", "RacerPass123");
      await pageA.click('button[type=submit]');
      await pageA.waitForURL("**/account/my-courses");

      const contextB = await browser.newContext();
      contexts.push(contextB);
      const pageB = await contextB.newPage();
      await pageB.goto("/register");
      await pageB.fill("#fullName", "متسابق ب");
      await pageB.fill("#email", uniqueEmail("racer-b"));
      await pageB.fill("#password", "RacerPass123");
      await pageB.click('button[type=submit]');
      await pageB.waitForURL("**/account/my-courses");

      await pageA.goto(`/courses/${course!.slug}`);
      await pageB.goto(`/courses/${course!.slug}`);
      await expect(pageA.getByText("التسجيل مفتوح")).toBeVisible();
      await expect(pageB.getByText("التسجيل مفتوح")).toBeVisible();

      // 3) الضغط على "سجّل الآن" في اللحظة نفسها من كلا المتصفحين
      await Promise.all([
        pageA.click('button:has-text("سجّل الآن")'),
        pageB.click('button:has-text("سجّل الآن")'),
      ]);

      // بعد اكتمال الطلبين: الفائز تتحول واجهته مباشرة للحالة الدائمة "أنت مسجَّل".
      // الخاسر يبقى معروضًا له نموذج التسجيل نفسه (بيانات الدورة المصفّحة عنده قد
      // لا تتحدّث فورًا لحظة السباق الدقيقة) لكن يظهر له خطأ "اكتملت المقاعد" الآتي
      // مباشرة من الخادم — وهو الدليل الحاسم على أن معاملة الحجز رفضته فعليًا.
      // مهلة أطول من الافتراضي: خادم next dev يُترجم المسارات عند الطلب، وقد يبطئ
      // تحت طلبين متزامنين أكثر من مهلة expect الافتراضية (5 ثوانٍ).
      const winLossLocator = (page: typeof pageA) =>
        page
          .getByText("أنت مسجَّل في هذه الدورة ✓")
          .or(page.getByText("المقاعد مكتملة"))
          .or(page.getByText("عذرًا، اكتملت مقاعد هذه الدورة"));

      await expect(winLossLocator(pageA)).toBeVisible({ timeout: 15_000 });
      await expect(winLossLocator(pageB)).toBeVisible({ timeout: 15_000 });

      const aSucceeded = await pageA.getByText("أنت مسجَّل في هذه الدورة ✓").isVisible();
      const bSucceeded = await pageB.getByText("أنت مسجَّل في هذه الدورة ✓").isVisible();

      // ينجح أحد الطلبين فقط أبدًا — لا كلاهما ولا لا أحد منهما
      expect(aSucceeded !== bSucceeded).toBe(true);

      // 4) التحقق من قاعدة البيانات مباشرة: لا تجاوز للسعة ولا تسجيل مكرر
      const finalCourse = await prisma.course.findUnique({ where: { id: course!.id } });
      expect(finalCourse!.remainingSeats).toBe(0);

      const activeEnrollments = await prisma.enrollment.count({
        where: { courseId: course!.id, status: "ACTIVE" },
      });
      expect(activeEnrollments).toBe(1);
    } finally {
      await Promise.all(contexts.map((c) => c.close()));
    }
  });
});
