import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3411";

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`);
  await page.fill("#identifier", email);
  await page.fill("#password", "Mutawir@2026");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(org|consultant|council|admin)$/);
}

test("full pre-assessment -> AI -> consultant approval -> gap -> task -> completion journey", async ({ page }) => {
  test.setTimeout(120_000);

  // 1) Org fills every indicator with a substantive answer and submits.
  await login(page, "org@mutawir.sa");
  await page.goto(`${BASE}/org/assessment/pre`);

  const textareas = page.locator("textarea[name=answerText]");
  const count = await textareas.count();
  expect(count).toBeGreaterThan(30);
  for (let i = 0; i < count; i++) {
    await textareas.nth(i).fill("تمتلك الجمعية وثيقة معتمدة رسميًا من مجلس الإدارة تغطي هذا البند، مرفق شاهد فعلي يثبت ذلك.");
  }
  const saveButtons = page.getByRole("button", { name: "حفظ كمسودة" });
  const saveCount = await saveButtons.count();
  for (let i = 0; i < saveCount; i++) {
    await saveButtons.nth(i).click();
    await page.waitForTimeout(50);
  }

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "إرسال للتحليل" }).click();
  await page.waitForTimeout(3000); // synchronous rules-only AI fallback engine runs server-side
  await expect(page.getByText("بانتظار اعتماد المستشار")).toBeVisible({ timeout: 15000 });

  // 2) Consultant reviews and approves every indicator, then approves the assessment.
  await login(page, "consultant@mutawir.sa");
  await page.goto(`${BASE}/consultant`);
  await page.getByText("الجمعية النموذجية بحائل").click();
  await page.getByText("التقييم القبلي").click();

  await expect(page.getByText(/مراجعة التقييم القبلي/)).toBeVisible();
  const decisionForms = page.locator("form:has(select[name=decision])");
  const decisionCount = await decisionForms.count();
  expect(decisionCount).toBe(count);
  for (let i = 0; i < decisionCount; i++) {
    const form = decisionForms.nth(i);
    const scoreInput = form.locator("input[name=finalScore]");
    if (!(await scoreInput.inputValue())) await scoreInput.fill("3.5");
    await form.getByRole("button", { name: "حفظ القرار" }).click();
    await page.waitForTimeout(60);
  }

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "اعتماد التقييم رسميًا" }).click();
  await expect(page.getByText(/النتيجة المعتمدة/)).toBeVisible({ timeout: 15000 });

  // 3) Gap analysis should now list gaps; generate + accept an AI task suggestion.
  await page.goto(`${BASE}/consultant`);
  await page.getByText("الجمعية النموذجية بحائل").click();
  await page.getByText("تحليل الفجوات").click();
  await expect(page.getByRole("heading", { name: /تحليل الفجوات/ })).toBeVisible();

  const suggestButton = page.getByRole("button", { name: /اقتراح مهمة تطويرية/ }).first();
  if (await suggestButton.count()) {
    await suggestButton.click();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "اعتماد الاقتراح" }).first().click();
    await page.waitForTimeout(500);
  }

  // 4) Org should now see the task in their plan and be able to submit it.
  await login(page, "org@mutawir.sa");
  await page.goto(`${BASE}/org/plan`);
  const taskLink = page.locator("a.card").first();
  await expect(taskLink).toBeVisible({ timeout: 10000 });
  await taskLink.click();

  await page.fill("input[name=linkUrl]", "https://example.com/evidence.pdf");
  await page.getByRole("button", { name: "رفع شاهد" }).click();
  await page.waitForTimeout(300);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "إرسال للمراجعة" }).click();
  await expect(page.getByText("بانتظار مراجعة المستشار")).toBeVisible({ timeout: 10000 });

  // 5) Consultant approves the task.
  await login(page, "consultant@mutawir.sa");
  await page.goto(`${BASE}/consultant`);
  await page.getByText("الجمعية النموذجية بحائل").click();
  await page.waitForURL(/\/consultant\/organizations\//);
  const orgId = page.url().split("/organizations/")[1];
  await page.goto(`${BASE}/consultant/organizations/${orgId}/plan`);
  await page.locator("a.card").first().click();

  await expect(page.getByRole("button", { name: "اعتماد الإنجاز" })).toBeVisible();
  await page.fill("textarea[name=note]", "شاهد مقبول، تم التحقق منه.");
  await page.getByRole("button", { name: "اعتماد الإنجاز" }).click();
  await expect(page.getByText("مكتملة")).toBeVisible({ timeout: 10000 });
});
