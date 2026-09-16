import { expect, test } from '@playwright/test';

const email = process.env.DOCSOPS_E2E_ADMIN_EMAIL?.trim() || 'ci-admin@example.com';
const password = process.env.DOCSOPS_E2E_ADMIN_PASSWORD?.trim() || 'ci-admin-password-12';

test.describe('DocsOps smoke', () => {
  test('login, open catalog, open a document', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/catalog/);
    await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });

    const createRes = await page.request.post('/api/v1/documents', {
      data: { title: 'E2E smoke document' },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()) as { id: string };
    expect(created.id).toBeTruthy();

    await page.goto(`/documents/${created.id}`);
    await expect(page.getByText('E2E smoke document').first()).toBeVisible({ timeout: 30_000 });
  });
});
