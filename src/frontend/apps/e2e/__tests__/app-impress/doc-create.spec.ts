import { expect, test } from '@playwright/test';

import { createDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Create', () => {
  test('it creates a doc', async ({ page, browserName }) => {
    const [docTitle] = await createDoc(page, 'My new doc', browserName, 1);

    await page.waitForFunction(
      () => document.title.match(/My new doc - Docs/),
      { timeout: 5000 },
    );

    const header = page.locator('header').first();
    await header.locator('h2').getByText('Docs').click();

    const datagrid = page.getByLabel('Datagrid of the documents page 1');
    const datagridTable = datagrid.getByRole('table');

    await expect(datagrid.getByLabel('Loading data')).toBeHidden({
      timeout: 10000,
    });
    await expect(datagridTable.getByText(docTitle)).toBeVisible({
      timeout: 5000,
    });
  });
});
