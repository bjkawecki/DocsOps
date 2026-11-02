import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loginAsDemoMember } from './helpers/login.js';

test.describe('Light mode color contrast', () => {
  test('home page color-contrast with light theme', async ({ page }) => {
    await loginAsDemoMember(page);

    const prefRes = await page.request.patch('/api/v1/me/preferences', {
      data: { theme: 'light' },
    });
    expect(prefRes.ok()).toBeTruthy();

    await page.addInitScript(() => {
      window.localStorage.setItem('docsops-color-scheme', 'light');
    });
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'light', {
      timeout: 15_000,
    });

    const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
