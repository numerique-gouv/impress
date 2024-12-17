import { expect, test } from '@playwright/test';

import { createDoc, goToGridDoc, keyCloakSignIn, randomName } from './common';

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

test.describe('Doc Create: Not loggued', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('it creates a doc server way', async ({
    page,
    browserName,
    request,
  }) => {
    const markdown = `This is a normal text\n\n# And this is a large heading`;
    const [title] = randomName('My server way doc create', browserName, 1);
    const data = {
      title,
      content: markdown,
      sub: `user@${browserName}.e2e`,
      email: `user@${browserName}.e2e`,
    };

    const newDoc = await request.post(
      `http://localhost:8071/api/v1.0/documents/create-for-owner/`,
      {
        data,
        headers: {
          Authorization: 'Bearer test-e2e',
          format: 'json',
        },
      },
    );

    expect(newDoc.ok()).toBeTruthy();

    await keyCloakSignIn(page, browserName);

    await goToGridDoc(page, { title });

    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    const editor = page.locator('.ProseMirror');
    await expect(editor.getByText('This is a normal text')).toBeVisible();
    await expect(
      editor.locator('h1').getByText('And this is a large heading'),
    ).toBeVisible();
  });
});
