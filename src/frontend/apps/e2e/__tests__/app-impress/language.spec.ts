import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Language', () => {
  test('checks the language picker', async ({ page }) => {
    await expect(
      page.getByRole('button', {
        name: 'Create a new document',
      }),
    ).toBeVisible();

    const header = page.locator('header').first();
    await header.getByRole('combobox').getByText('English').click();
    await header.getByRole('option', { name: 'Français' }).click();
    await expect(
      header.getByRole('combobox').getByText('Français'),
    ).toBeVisible();

    await expect(
      page.getByRole('button', {
        name: 'Créer un nouveau document',
      }),
    ).toBeVisible();
  });
});
