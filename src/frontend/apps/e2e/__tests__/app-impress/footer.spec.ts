import { expect, test } from '@playwright/test';

import { keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Footer', () => {
  test('checks all the elements are visible', async ({ page }) => {
    const footer = page.locator('footer').first();

    await expect(footer.getByAltText('Marianne Logo')).toBeVisible();

    await expect(
      footer.getByAltText('Freedom Equality Fraternity Logo'),
    ).toBeVisible();

    await expect(
      footer.getByRole('link', { name: 'legifrance.gouv.fr' }),
    ).toBeVisible();

    await expect(
      footer.getByRole('link', { name: 'info.gouv.fr' }),
    ).toBeVisible();

    await expect(
      footer.getByRole('link', { name: 'service-public.fr' }),
    ).toBeVisible();

    await expect(
      footer.getByRole('link', { name: 'data.gouv.fr' }),
    ).toBeVisible();

    await expect(
      footer.getByText(
        'Unless otherwise stated, all content on this site is under licence',
      ),
    ).toBeVisible();
  });
});
