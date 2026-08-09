import { test, expect } from "@playwright/test";
import { loginAs, logout, idFromDetailUrl, uniqueTitle } from "./helpers";

test.describe("متابعة ما بعد القبول: التزامات التقارير، سجل الدعم التاريخي، والمراسلات", () => {
  test("سجل الدعم المالي التاريخي للمانح يعرض الإجمالي الصحيح", async ({ page }) => {
    await loginAs(page, "officer");

    const donorName = uniqueTitle("جهة سجل دعم");
    await page.goto("/donors/new");
    await page.fill("input[name=name]", donorName);
    await page.click('button[type=submit]:has-text("حفظ الجهة")');
    const donorId = await idFromDetailUrl(page, "donors");

    await page.fill('input[name=year]', "2024");
    await page.fill('input[name=amount]', "50000");
    await page.click('button[type=submit]:has-text("إضافة سجل دعم")');
    await expect(page.getByText("2024 — 50,000 ر.س")).toBeVisible();

    await page.fill('input[name=year]', "2025");
    await page.fill('input[name=amount]', "30000");
    await page.click('button[type=submit]:has-text("إضافة سجل دعم")');
    await expect(page.getByText("الإجمالي: 80,000 ر.س")).toBeVisible();
  });

  test("قبول الطلب يُظهر لوحة التزامات التقارير، ويمكن تعليم التزام كمُقدَّم، وتوليد خطاب شكر يظهر عند المانح", async ({ page }) => {
    await loginAs(page, "officer");

    const projectTitle = uniqueTitle("مشروع لمتابعة ما بعد القبول");
    await page.goto("/projects/new");
    await page.fill("input[name=title]", projectTitle);
    await page.click('button[type=submit]:has-text("حفظ المشروع")');
    const projectId = await idFromDetailUrl(page, "projects");

    const donorName = uniqueTitle("جهة لمتابعة ما بعد القبول");
    await page.goto("/donors/new");
    await page.fill("input[name=name]", donorName);
    await page.click('button[type=submit]:has-text("حفظ الجهة")');
    const donorId = await idFromDetailUrl(page, "donors");

    const oppTitle = uniqueTitle("فرصة لمتابعة ما بعد القبول");
    await page.goto(`/opportunities/new?projectId=${projectId}`);
    await page.fill("input[name=title]", oppTitle);
    await page.selectOption("select[name=donorId]", donorId);
    await page.click('button[type=submit]:has-text("حفظ الفرصة")');
    await idFromDetailUrl(page, "opportunities");

    await page.goto(`/applications/new?projectId=${projectId}`);
    await page.click('button[type=submit]:has-text("بدء إعداد الطلب")');
    await page.waitForFunction(
      () => location.pathname.includes("/applications/") && !location.pathname.endsWith("/new")
    );
    const appId = await idFromDetailUrl(page, "applications");

    // اربط الطلب بفرصة التمويل (وبالتالي بالمانح) قبل القبول
    await page.locator('label:has-text("ربط بفرصة تمويل") + select').selectOption({ label: oppTitle });
    await page.click('button[type=submit]:has-text("حفظ التغييرات")');
    await expect(page.getByText("تم حفظ التغييرات بنجاح")).toBeVisible();

    // الاعتماد النهائي يتطلب صلاحية مدير الجمعية، ولا يمكن للمنشئ اعتماد طلبه (فصل المهام)
    await logout(page);
    await loginAs(page, "manager");
    await page.goto(`/applications/${appId}`);
    await page.selectOption("select[name=toStatus]", "مقبول");
    await page.click('button[type=submit]:has-text("تحديث الحالة")');
    await expect(page.getByText("تم تحديث الحالة")).toBeVisible();

    // لوحة التزامات التقارير تظهر الآن لأن الطلب مقبول
    await expect(page.getByText("التزامات التقارير لما بعد القبول")).toBeVisible();
    // اسم الحقل "title" غير فريد في الصفحة (يشترك فيه عنوان الطلب أيضًا)، لذا نحدده عبر placeholder
    await page.getByPlaceholder("عنوان التقرير (مثال: تقرير ربعي أول)").fill("تقرير مرحلي أول");
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 20);
    await page.fill('input[name=dueDate]', dueDate.toISOString().slice(0, 10));
    await page.click('button[type=submit]:has-text("إضافة التزام")');
    await expect(page.getByText("تقرير مرحلي أول")).toBeVisible();
    await expect(page.getByText("مستحق", { exact: true })).toBeVisible();

    await page.locator('button:has-text("وضع علامة مُقدَّم")').first().click();
    await expect(page.getByText("تم التقديم", { exact: true })).toBeVisible();

    // توليد خطاب شكر رسمي وعرضه
    await expect(page.getByText("المراسلات والخطابات الرسمية")).toBeVisible();
    await page.click('button:has-text("توليد خطاب شكر")');
    await expect(page.getByText("خطاب شكر وتقدير", { exact: false }).first()).toBeVisible();

    const printHref = await page.locator('a:has-text("عرض/طباعة")').first().getAttribute("href");
    expect(printHref).toBeTruthy();
    await page.goto(printHref!);
    await expect(page.getByText("خطاب شكر وتقدير")).toBeVisible();

    // الخطاب يظهر أيضًا في صفحة المانح
    await page.goto(`/donors/${donorId}`);
    await expect(page.getByText("الخطابات والمراسلات")).toBeVisible();
  });
});
