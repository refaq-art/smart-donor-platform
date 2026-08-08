import { test, expect } from '@playwright/test';
import { loginAsAdmin, uniqueName } from './helpers';

test('المسؤول يمكنه إنشاء سؤال جديد ورؤيته في قائمة الأسئلة', async ({ page }) => {
  await loginAsAdmin(page);

  const questionText = uniqueName('سؤال اختباري');

  await page.goto('/admin/questions/new');
  await page.getByTestId('question-category-select').selectOption({ index: 1 });
  await page.getByTestId('question-text-input').fill(questionText);
  await page.getByTestId('question-answer-input-0').fill('الإجابة الصحيحة');
  await page.getByTestId('question-answer-input-1').fill('إجابة خاطئة');
  await page.getByTestId('question-save-button').click();

  await page.waitForURL('**/admin/questions');
  await page.getByTestId('question-search-input').fill(questionText);
  await expect(page.getByTestId('question-row').filter({ hasText: questionText })).toBeVisible({ timeout: 10_000 });
});
