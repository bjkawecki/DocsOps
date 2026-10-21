import { expect, test } from '@playwright/test';
import { loginAsDemoMember } from './helpers/login.js';

test.describe('DocsOps smoke', () => {
  test('login, open catalog, open a document', async ({ page }) => {
    await loginAsDemoMember(page);

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
