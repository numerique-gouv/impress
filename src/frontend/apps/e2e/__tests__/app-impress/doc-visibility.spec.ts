import { expect, test } from '@playwright/test';

import { createDoc, keyCloakSignIn } from './common';

test.describe('Doc Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Make a public doc', async ({ page, browserName }) => {
    const [docTitle] = await createDoc(
      page,
      'My new doc',
      browserName,
      1,
      true,
    );

    const header = page.locator('header').first();
    await header.locator('h2').getByText('Docs').click();

    const datagrid = page
      .getByLabel('Datagrid of the documents page 1')
      .getByRole('table');

    await expect(datagrid.getByLabel('Loading data')).toBeHidden();

    await expect(datagrid.getByText(docTitle)).toBeVisible();

    const row = datagrid.getByRole('row').filter({
      hasText: docTitle,
    });

    await expect(row.getByRole('cell').nth(0)).toHaveText('Public');
  });
});

test.describe('Doc Visibility: Not loggued', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('A public doc is accessible even when not authentified.', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(
      page,
      'My new doc',
      browserName,
      1,
      true,
    );

    await expect(
      page.getByText('The document visiblitity has been updated.'),
    ).toBeVisible();

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    await page.goto(urlDoc);

    await expect(page.locator('h2').getByText(docTitle)).toBeVisible();
  });
});
