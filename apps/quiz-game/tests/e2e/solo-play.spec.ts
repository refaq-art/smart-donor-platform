import { test, expect } from '@playwright/test';
import { loginAsGuest, uniqueName, answerQuizToCompletion } from './helpers';

test.describe('اللعب الفردي', () => {
  test('لعبة سريعة من الصفحة الرئيسية تنتهي بشاشة نتائج', async ({ page }) => {
    await loginAsGuest(page, uniqueName('ضيف'));

    await expect(page.getByTestId('quick-play-button')).toBeVisible();
    await page.getByTestId('quick-play-button').click();

    await page.waitForURL('**/play/game/**', { timeout: 20_000 });

    await answerQuizToCompletion(page);

    await expect(page.getByTestId('final-results-heading')).toBeVisible();
  });

  test('إعداد لعبة كلاسيكية عبر صفحة الإعداد يعمل من البداية للنهاية', async ({ page }) => {
    await loginAsGuest(page, uniqueName('لاعب'));

    await page.goto('/play/setup');
    await expect(page.getByRole('heading', { name: 'إعداد اللعبة' })).toBeVisible();

    // اختر أول تصنيف متاح فيه أسئلة
    const firstCategory = page.locator('button:has(span.ms-auto):not([disabled])').first();
    await firstCategory.click();

    await page.getByRole('button', { name: 'ابدأ اللعبة' }).click();
    await page.waitForURL('**/play/game/**', { timeout: 20_000 });

    await answerQuizToCompletion(page);
    await expect(page.getByTestId('final-results-heading')).toBeVisible();
  });
});
