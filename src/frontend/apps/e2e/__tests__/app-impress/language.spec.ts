import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Language', () => {
  test('checks the language picker', async ({ page }) => {
    await expect(
      page.getByRole('button', {
        name: 'Create a new pad',
      }),
    ).toBeVisible();

    const header = page.locator('header').first();
    await header.getByRole('combobox').getByText('EN').click();
    await header.getByRole('option', { name: 'FR' }).click();
    await expect(header.getByRole('combobox').getByText('FR')).toBeVisible();

    await expect(
      page.getByRole('button', {
        name: 'Créer un nouveau pad',
      }),
    ).toBeVisible();
  });
});
