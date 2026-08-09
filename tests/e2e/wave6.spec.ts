import { test, expect } from "@playwright/test";
import { loginAs, idFromDetailUrl, uniqueTitle } from "./helpers";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function uploadDoc(page: import("@playwright/test").Page, title: string, category: string, expiryDays: number) {
  await page.goto("/settings/organization");
  await page.fill("input[name=title]", title);
  await page.selectOption("select[name=category]", category);
  await page.fill("input[name=expiryDate]", isoDaysFromNow(expiryDays));
  await page.setInputFiles("input[type=file][name=file]", {
    name: `${title}.png`,
    mimeType: "image/png",
    buffer: Buffer.from(TINY_PNG_BASE64, "base64"),
  });
  await page.click('button:has-text("رفع المستند")');
  await expect(page.getByText("تم رفع المستند")).toBeVisible();
}

test.describe("فحص أهلية أعمق: صلاحية المستند حتى الموعد النهائي وربطه بالنتيجة", () => {
  test("مستند ينتهي قبل الموعد النهائي للفرصة يُفشل الشرط رغم صلاحيته اليوم، ويصبح مؤهلًا عند رفع مستند يبقى ساريًا", async ({ page }) => {
    await loginAs(page, "manager");

    // تصنيف غير مستخدم في بيانات البذر التجريبية لتفادي تداخل مستند سابق طويل الصلاحية
    const docCategory = "الميزانية السنوية";
    const soonTitle = uniqueTitle("ترخيص قريب الانتهاء");
    const farTitle = uniqueTitle("ترخيص بعيد الانتهاء");

    // مستند ساري الصلاحية اليوم لكنه سينتهي قبل الموعد النهائي للفرصة (بعد 30 يومًا)
    await uploadDoc(page, soonTitle, docCategory, 10);

    const projectTitle = uniqueTitle("مشروع لفحص أهلية أعمق");
    await page.goto("/projects/new");
    await page.fill("input[name=title]", projectTitle);
    await page.click('button[type=submit]:has-text("حفظ المشروع")');
    const projectId = await idFromDetailUrl(page, "projects");

    const oppTitle = uniqueTitle("فرصة لفحص أهلية أعمق");
    await page.goto(`/opportunities/new?projectId=${projectId}`);
    await page.fill("input[name=title]", oppTitle);
    await page.fill("input[name=deadline]", isoDaysFromNow(30));
    await page.click('button[type=submit]:has-text("حفظ الفرصة")');
    const oppId = await idFromDetailUrl(page, "opportunities");

    // أضف شرط أهلية يطلب توفر مستند من هذا التصنيف
    await page.click('button:has-text("إضافة شرط أهلية")');
    await page.fill("input[name=label]", "يلزم توفر ترخيص ساري الجمعية");
    await page.selectOption("select[name=ruleKey]", "HAS_DOCUMENT");
    await page.selectOption("select[name=documentCategory]", docCategory);
    await page.click('button[type=submit]:has-text("حفظ الشرط")');

    // المستند ساري اليوم لكنه سينتهي قبل الموعد النهائي — يجب أن يظهر الشرط كغير مستوفى مع توضيح السبب
    await expect(page.getByText("غير مؤهل", { exact: true })).toBeVisible();
    await expect(page.getByText("قبل الموعد النهائي للفرصة", { exact: false })).toBeVisible();

    // مستند آخر من نفس التصنيف يبقى ساريًا بعد الموعد النهائي
    await uploadDoc(page, farTitle, docCategory, 60);

    // إعادة الفحص من صفحة الفرصة — يجب أن يصبح الشرط مستوفى ويشير إلى المستند الجديد تحديدًا
    await page.goto(`/opportunities/${oppId}`);
    await page.click('button:has-text("إعادة الفحص")');
    await expect(page.getByText("مؤهل", { exact: true })).toBeVisible();
    await expect(page.getByText(`عرض المستند: ${farTitle}`)).toBeVisible();
  });
});
