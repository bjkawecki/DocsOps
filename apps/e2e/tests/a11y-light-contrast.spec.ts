import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const email = process.env.DOCSOPS_E2E_ADMIN_EMAIL?.trim() || 'ci-admin@example.com';
const password = process.env.DOCSOPS_E2E_ADMIN_PASSWORD?.trim() || 'ci-admin-password-12';

test.describe('Light mode color contrast', () => {
  test('home page color-contrast with light theme', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

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
