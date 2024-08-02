import { expect, test } from '@playwright/test';
import cs from 'convert-stream';
import pdf from 'pdf-parse';

import { createDoc, goToGridDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Tools', () => {
  test('it converts the doc to pdf with a template integrated', async ({
    page,
    browserName,
  }) => {
    const [randomDoc] = await createDoc(page, 'doc-editor', browserName, 1);

    const downloadPromise = page.waitForEvent('download', (download) => {
      return download.suggestedFilename().includes(`${randomDoc}.pdf`);
    });

    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

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
    expect(download.suggestedFilename()).toBe(`${randomDoc}.pdf`);

    const pdfBuffer = await cs.toBuffer(await download.createReadStream());
    const pdfText = (await pdf(pdfBuffer)).text;

    expect(pdfText).toContain('Hello World'); // This is the doc text
  });

  test('it converts the blocknote json in correct html for the pdf', async ({
    page,
    browserName,
  }) => {
    const [randomDoc] = await createDoc(page, 'doc-editor', browserName, 1);
    let body = '';

    await page.route('**/templates/*/generate-document/', async (route) => {
      const request = route.request();
      body = request.postDataJSON().body;

      await route.continue();
    });

    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.locator('.bn-block-outer').last().fill('Hello World');
    await page.locator('.bn-block-outer').last().click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.locator('.bn-block-outer').last().fill('Break');
    await expect(page.getByText('Break')).toBeVisible();

    // Center the text
    await page.getByText('Break').dblclick();
    await page.locator('button[data-test="alignTextCenter"]').click();

    // Change the background color
    await page.getByText('Break').dblclick();
    await page.locator('button[data-test="colors"]').click();
    await page.locator('button[data-test="background-color-brown"]').click();

    // Change the text color
    await page.getByText('Break').dblclick();
    await page.locator('button[data-test="colors"]').click();
    await page.locator('button[data-test="text-color-orange"]').click();

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
    expect(body.match(/<br\/>/g)?.length).toBeGreaterThanOrEqual(2);
    expect(body).toContain('style="color: orange;"');
    expect(body).toContain('style="text-align: center;"');
    expect(body).toContain('style="background-color: brown;"');
  });

  test('it updates the doc', async ({ page, browserName }) => {
    const [randomDoc] = await createDoc(
      page,
      'doc-update',
      browserName,
      1,
      true,
    );
    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Update document',
      })
      .click();

    await expect(
      page.locator('h2').getByText(`Update document "${randomDoc}"`),
    ).toBeVisible();

    await expect(
      page.getByRole('checkbox', { name: 'Is it public ?' }),
    ).toBeChecked();

    await page.getByText('Document name').fill(`${randomDoc}-updated`);
    await page.getByText('Is it public ?').click();

    await page
      .getByRole('button', {
        name: 'Validate the modification',
      })
      .click();

    await expect(
      page.getByText('The document has been updated.'),
    ).toBeVisible();

    const docTitle = await goToGridDoc(page, {
      title: `${randomDoc}-updated`,
    });

    await expect(page.locator('h2').getByText(docTitle)).toBeVisible();

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

  test('it deletes the doc', async ({ page, browserName }) => {
    const [randomDoc] = await createDoc(page, 'doc-delete', browserName, 1);
    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Delete document',
      })
      .click();

    await expect(
      page.locator('h2').getByText(`Deleting the document "${randomDoc}"`),
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

    const row = page
      .getByLabel('Datagrid of the documents page 1')
      .getByRole('table')
      .getByRole('row')
      .filter({
        hasText: randomDoc,
      });

    expect(await row.count()).toBe(0);
  });

  test('it checks the options available if administrator', async ({ page }) => {
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

    await goToGridDoc(page);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();

    await page.getByLabel('Open the document options').click();

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

  test('it checks the options available if editor', async ({ page }) => {
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

    await goToGridDoc(page);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Share' })).toBeHidden();

    await page.getByLabel('Open the document options').click();

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

  test('it checks the options available if reader', async ({ page }) => {
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

    await goToGridDoc(page);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Share' })).toBeHidden();

    await page.getByLabel('Open the document options').click();

    await expect(page.getByRole('button', { name: 'Share' })).toBeHidden();
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
