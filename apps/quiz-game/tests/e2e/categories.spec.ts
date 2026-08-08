import { test, expect } from '@playwright/test';
import { loginAsGuest, uniqueName } from './helpers';

test('صفحة التصنيفات تعرض التصنيفات المزروعة', async ({ page }) => {
  await loginAsGuest(page, uniqueName('ضيف'));

  await page.goto('/categories');
  await expect(page.getByRole('heading', { name: /التصنيفات/ })).toBeVisible();
  await expect(page.getByText('جغرافيا')).toBeVisible();
  await expect(page.getByText('تاريخ')).toBeVisible();
});
