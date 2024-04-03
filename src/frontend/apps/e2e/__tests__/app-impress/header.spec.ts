import { expect, test } from '@playwright/test';

import { keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Header', () => {
  test('checks all the elements are visible', async ({ page }) => {
    const header = page.locator('header').first();

    await expect(header.getByAltText('Marianne Logo')).toBeVisible();

    await expect(
      header.getByAltText('Freedom Equality Fraternity Logo'),
    ).toBeVisible();

    await expect(header.getByAltText('Impress Logo')).toBeVisible();
    await expect(header.locator('h2').getByText('Impress')).toHaveCSS(
      'color',
      'rgb(0, 0, 145)',
    );
    await expect(header.locator('h2').getByText('Impress')).toHaveCSS(
      'font-family',
      /Marianne/i,
    );

    await expect(
      header.getByText('Les applications de La Suite numérique'),
    ).toBeVisible();

    await expect(header.getByAltText('Language Icon')).toBeVisible();

    await expect(header.getByText('John Doe')).toBeVisible();
    await expect(
      header.getByRole('img', {
        name: 'profile picture',
      }),
    ).toBeVisible();
  });
});
