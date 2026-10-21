import { expect, test } from '@playwright/test';

/** Seeded team member (CSV); platform admin has no catalog docs without org membership. */
const email = process.env.DOCSOPS_E2E_USER_EMAIL?.trim() || 'member@demo.docsops.local';
const password = process.env.DOCSOPS_E2E_USER_PASSWORD?.trim() || 'DocsOps1';

test.describe('DocsOps smoke', () => {
  test('login, open catalog, open a document', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    // Mantine PasswordInput visibility toggle aria-label also contains "password".
    await page.locator('#login-password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/catalog/);
    await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });

    const catalogRes = await page.request.get('/api/v1/documents?limit=20');
    expect(catalogRes.ok()).toBeTruthy();
    const catalog = (await catalogRes.json()) as { items: { id: string; title: string }[] };
    const doc = catalog.items.find((item) => item.id && item.title);
    expect(doc, 'expected at least one readable catalog document').toBeTruthy();

    await page.goto(`/documents/${doc!.id}`);
    await expect(page.getByText(doc!.title).first()).toBeVisible({ timeout: 30_000 });
  });
});
