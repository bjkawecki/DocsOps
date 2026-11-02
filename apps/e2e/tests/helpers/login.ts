import { expect, type Page } from '@playwright/test';

/**
 * DEMO_MODE login: click the seed role picker (password form is collapsed).
 * CI enables DEMO_MODE via deploy/docker-compose.ci-seed.yml.
 */
export async function loginAsDemoMember(page: Page): Promise<void> {
  await page.goto('/login');
  const memberBtn = page.getByRole('button', { name: 'Team Member' });
  await expect(memberBtn).toBeVisible({ timeout: 30_000 });
  await memberBtn.click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}
