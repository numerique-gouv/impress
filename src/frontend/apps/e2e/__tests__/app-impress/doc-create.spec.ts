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

    const card = page.getByLabel('Create new document card').first();

    await expect(card.getByLabel('Document name')).toBeVisible();

    await expect(card.getByLabel('icon group')).toBeVisible();

    await expect(
      card.getByRole('heading', {
        name: 'Name the document',
        level: 3,
      }),
    ).toBeVisible();

    await expect(card.getByText('Is it public ?')).toBeVisible();

    await expect(
      card.getByRole('button', {
        name: 'Create the document',
      }),
    ).toBeVisible();

    await expect(
      card.getByRole('button', {
        name: 'Cancel',
      }),
    ).toBeVisible();

    await expect(page).toHaveURL('/docs/create/');
  });

  test('checks the cancel button interaction', async ({ page }) => {
    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new document',
    });
    await buttonCreateHomepage.click();
    await expect(buttonCreateHomepage).toBeHidden();

    const card = page.getByLabel('Create new document card').first();

    await card
      .getByRole('button', {
        name: 'Cancel',
      })
      .click();

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

    await expect(datagrid.getByText(docTitle)).toBeVisible();

    const row = datagrid.getByRole('row').filter({
      hasText: docTitle,
    });

    await expect(row.getByRole('cell').nth(0)).toHaveText('Public');
  });
});
