import { test, expect } from '@playwright/test';
import { loginAsGuest, uniqueName, answerQuizToCompletion } from './helpers';

test('لوحة المتصدرين تعرض اللاعب بعد لعب مباراة', async ({ page }) => {
  const name = uniqueName('متصدر');
  await loginAsGuest(page, name);

  await page.getByTestId('quick-play-button').click();
  await page.waitForURL('**/play/game/**', { timeout: 20_000 });
  await answerQuizToCompletion(page);
  await expect(page.getByTestId('final-results-heading')).toBeVisible();

  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: /لوحة المتصدرين/ })).toBeVisible();
  await expect(page.getByTestId('leaderboard-row').filter({ hasText: name })).toBeVisible({ timeout: 10_000 });
});
