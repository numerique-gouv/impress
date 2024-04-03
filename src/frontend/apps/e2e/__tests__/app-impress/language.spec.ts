import { expect, test } from '@playwright/test';

import { keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
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
