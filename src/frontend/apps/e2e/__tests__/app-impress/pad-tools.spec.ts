import { expect, test } from '@playwright/test';
import cs from 'convert-stream';
import pdf from 'pdf-parse';

import { createPad, keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Pad Tools', () => {
  test('it converts the pad to pdf with a template integrated', async ({
    page,
    browserName,
  }) => {
    const [randomPad] = await createPad(page, 'pad-editor', browserName, 1);

    const downloadPromise = page.waitForEvent('download', (download) => {
      return download.suggestedFilename().includes(`${randomPad}.pdf`);
    });

    await expect(page.locator('h2').getByText(randomPad)).toBeVisible();

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Generate PDF',
      })
      .click();

    await page
      .getByRole('button', {
        name: 'Download',
      })
      .click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${randomPad}.pdf`);

    const pdfBuffer = await cs.toBuffer(await download.createReadStream());
    const pdfText = (await pdf(pdfBuffer)).text;

    expect(pdfText).toContain('Hello World'); // This is the pad text
  });

  test('it converts the blocknote json in correct html for the pdf', async ({
    page,
    browserName,
  }) => {
    const [randomPad] = await createPad(page, 'pad-editor', browserName, 1);
    let body = '';

    await page.route('**/templates/*/generate-document/', async (route) => {
      const request = route.request();
      body = request.postDataJSON().body;

      await route.continue();
    });

    await expect(page.locator('h2').getByText(randomPad)).toBeVisible();

    await page.locator('.bn-block-outer').last().fill('Hello World');
    await page.locator('.bn-block-outer').last().click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.locator('.bn-block-outer').last().fill('Break');

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Generate PDF',
      })
      .click();

    await page
      .getByRole('button', {
        name: 'Download',
      })
      .click();

    // Empty paragraph should be replaced by a <br/>
    expect(body).toContain('<br/><br/>');
  });

  test('it updates the pad', async ({ page, browserName }) => {
    const [randomPad] = await createPad(
      page,
      'pad-update',
      browserName,
      1,
      true,
    );
    await expect(page.locator('h2').getByText(randomPad)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Update document',
      })
      .click();

    await expect(
      page.locator('h2').getByText(`Update document "${randomPad}"`),
    ).toBeVisible();

    await expect(
      page.getByRole('checkbox', { name: 'Is it public ?' }),
    ).toBeChecked();

    await page.getByText('Document name').fill(`${randomPad}-updated`);
    await page.getByText('Is it public ?').click();

    await page
      .getByRole('button', {
        name: 'Validate the modification',
      })
      .click();

    await expect(
      page.getByText('The document has been updated.'),
    ).toBeVisible();

    const panel = page.getByLabel('Documents panel').first();
    await expect(
      panel.locator('li').getByText(`${randomPad}-updated`),
    ).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Update document',
      })
      .click();

    await expect(
      page.getByRole('checkbox', { name: 'Is it public ?' }),
    ).not.toBeChecked();
  });

  test('it deletes the pad', async ({ page, browserName }) => {
    const [randomPad] = await createPad(page, 'pad-delete', browserName, 1);
    await expect(page.locator('h2').getByText(randomPad)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Delete document',
      })
      .click();

    await expect(
      page.locator('h2').getByText(`Deleting the document "${randomPad}"`),
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: 'Confirm deletion',
      })
      .click();

    await expect(
      page.getByText('The document has been deleted.'),
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Create a new document' }),
    ).toBeVisible();

    const panel = page.getByLabel('Documents panel').first();
    await expect(panel.locator('li').getByText(randomPad)).toBeHidden();
  });

  test('it checks the options available if administrator', async ({
    page,
    browserName,
  }) => {
    await page.route('**/documents/**/', async (route) => {
      const request = route.request();
      if (
        request.method().includes('GET') &&
        !request.url().includes('page=')
      ) {
        await route.fulfill({
          json: {
            id: 'b0df4343-c8bd-4c20-9ff6-fbf94fc94egg',
            content: '',
            title: 'Mocked document',
            accesses: [],
            abilities: {
              destroy: false, // Means not owner
              versions_destroy: true,
              versions_list: true,
              versions_retrieve: true,
              manage_accesses: true, // Means admin
              update: true,
              partial_update: true,
              retrieve: true,
            },
            is_public: false,
          },
        });
      } else {
        await route.continue();
      }
    });

    await createPad(page, 'pad-tools-right-admin', browserName, 1);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await page.getByLabel('Open the document options').click();

    await expect(
      page.getByRole('button', { name: 'Add members' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Generate PDF' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Update document' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Delete document' }),
    ).toBeHidden();
  });

  test('it checks the options available if editor', async ({
    page,
    browserName,
  }) => {
    await page.route('**/documents/**/', async (route) => {
      const request = route.request();
      if (
        request.method().includes('GET') &&
        !request.url().includes('page=')
      ) {
        await route.fulfill({
          json: {
            id: 'b0df4343-c8bd-4c20-9ff6-fbf94fc94egg',
            content: '',
            title: 'Mocked document',
            accesses: [],
            abilities: {
              destroy: false, // Means not owner
              versions_destroy: true,
              versions_list: true,
              versions_retrieve: true,
              manage_accesses: false, // Means not admin
              update: true,
              partial_update: true, // Means editor
              retrieve: true,
            },
            is_public: false,
          },
        });
      } else {
        await route.continue();
      }
    });

    await createPad(page, 'pad-tools-right-editor', browserName, 1);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await page.getByLabel('Open the document options').click();

    await expect(
      page.getByRole('button', { name: 'Add members' }),
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Generate PDF' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Update document' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Delete document' }),
    ).toBeHidden();
  });

  test('it checks the options available if reader', async ({
    page,
    browserName,
  }) => {
    await page.route('**/documents/**/', async (route) => {
      const request = route.request();
      if (
        request.method().includes('GET') &&
        !request.url().includes('page=')
      ) {
        await route.fulfill({
          json: {
            id: 'b0df4343-c8bd-4c20-9ff6-fbf94fc94egg',
            content: '',
            title: 'Mocked document',
            accesses: [],
            abilities: {
              destroy: false, // Means not owner
              versions_destroy: false,
              versions_list: true,
              versions_retrieve: true,
              manage_accesses: false, // Means not admin
              update: false,
              partial_update: false, // Means not editor
              retrieve: true,
            },
            is_public: false,
          },
        });
      } else {
        await route.continue();
      }
    });

    await createPad(page, 'pad-tools-right-reader', browserName, 1);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await page.getByLabel('Open the document options').click();

    await expect(
      page.getByRole('button', { name: 'Add members' }),
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Generate PDF' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Update document' }),
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Delete document' }),
    ).toBeHidden();
  });
});
