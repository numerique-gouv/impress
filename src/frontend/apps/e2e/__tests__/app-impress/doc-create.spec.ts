import { expect, test } from '@playwright/test';

import { createDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Create', () => {
  test('checks all the create doc elements are visible', async ({ page }) => {
    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new document',
    });
    await buttonCreateHomepage.click();
    await expect(buttonCreateHomepage).toBeHidden();

    const card = page.getByRole('dialog').first();

    await expect(
      card.locator('h2').getByText('Create a new document'),
    ).toBeVisible();
    await expect(card.getByLabel('Document name')).toBeVisible();

    await expect(card.getByText('Is it public ?')).toBeVisible();

    await expect(
      card.getByRole('button', {
        name: 'Create the document',
      }),
    ).toBeVisible();

    await expect(card.getByLabel('Close the modal')).toBeVisible();
  });

  test('checks the cancel button interaction', async ({ page }) => {
    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new document',
    });
    await buttonCreateHomepage.click();
    await expect(buttonCreateHomepage).toBeHidden();

    const card = page.getByRole('dialog').first();

    await card.getByLabel('Close the modal').click();

    await expect(buttonCreateHomepage).toBeVisible();
  });

  test('create a new public doc', async ({ page, browserName }) => {
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
