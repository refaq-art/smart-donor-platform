import { Page, expect } from '@playwright/test';

export function uniqueName(prefix: string) {
  return `${prefix}${Date.now()}`.slice(0, 20);
}

/** يسجّل الدخول كضيف (التبويب الافتراضي في صفحة /login) وينتظر الوصول للصفحة الرئيسية. */
export async function loginAsGuest(page: Page, displayName: string) {
  await page.goto('/login');
  await page.getByTestId('display-name-input').fill(displayName);
  await page.getByTestId('auth-submit').click();
  await page.waitForURL('**/');
}

/**
 * يجيب على أسئلة اللعبة الحالية (أي نوع سؤال) حتى ظهور شاشة النتائج النهائية.
 * لا يهتم بصحة الإجابة — الهدف اختبار سلامة تدفق اللعب فقط.
 */
export async function answerQuizToCompletion(page: Page, maxRounds = 30) {
  for (let round = 0; round < maxRounds; round++) {
    const finalHeading = page.getByTestId('final-results-heading');
    if (await finalHeading.isVisible().catch(() => false)) {
      return;
    }

    await expect(page.getByTestId('question-text')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(200); // اسمح لحركات الدخول (Framer Motion) بالاستقرار قبل النقر

    const wordInput = page.getByTestId('text-answer-input');
    const orderingSubmit = page.getByTestId('ordering-submit');
    const choiceOption = page.getByTestId('answer-option').first();

    if (await wordInput.isVisible().catch(() => false)) {
      await wordInput.fill('إجابة اختبارية');
      await page.getByTestId('text-answer-submit').click();
    } else if (await orderingSubmit.isVisible().catch(() => false)) {
      await orderingSubmit.click();
    } else {
      await choiceOption.click();
    }

    // بعد الإجابة: إمّا يظهر زر "التالي" (فردي) أو تنتقل الجولة تلقائيًا (أونلاين)
    const nextButton = page.getByTestId('round-next');
    const appeared = await Promise.race([
      nextButton.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'next' as const),
      finalHeading.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'final' as const),
    ]).catch(() => null);

    if (appeared === 'next') {
      await nextButton.click();
    } else if (appeared === 'final') {
      return;
    }
  }
  throw new Error('لم تنتهِ المباراة خلال العدد الأقصى للجولات المتوقّع');
}
