import { expect, test } from '@playwright/test';
import cs from 'convert-stream';
import jsdom from 'jsdom';
import pdf from 'pdf-parse';

import { createDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Export', () => {
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
        name: 'Export',
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

  test('it converts the doc to docx with a template integrated', async ({
    page,
    browserName,
  }) => {
    const [randomDoc] = await createDoc(page, 'doc-editor', browserName, 1);

    const downloadPromise = page.waitForEvent('download', (download) => {
      return download.suggestedFilename().includes(`${randomDoc}.docx`);
    });

    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Export',
      })
      .click();

    await page.getByText('Docx').click();

    await page
      .getByRole('button', {
        name: 'Download',
      })
      .click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${randomDoc}.docx`);
  });

  test('it converts the blocknote json in correct html for the export', async ({
    page,
    browserName,
  }) => {
    test.slow();

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

    // Add a list
    await page.locator('.bn-block-outer').last().click();
    await page.keyboard.press('Enter');
    await page.locator('.bn-block-outer').last().fill('Test List 1');
    await page.getByText('Test List 1').dblclick();
    await page
      .getByRole('button', {
        name: 'Paragraph',
      })
      .click();
    await page
      .getByRole('menuitem', {
        name: 'Bullet List',
      })
      .click();
    await page
      .locator('.bn-block-content[data-content-type="bulletListItem"]')
      .last()
      .click();
    await page.keyboard.press('Enter');
    await page
      .locator('.bn-block-content[data-content-type="bulletListItem"] p')
      .last()
      .fill('Test List 2');
    await page.keyboard.press('Enter');
    await page
      .locator('.bn-block-content[data-content-type="bulletListItem"] p')
      .last()
      .fill('Test List 3');

    await page.keyboard.press('Enter');
    await page.keyboard.press('Backspace');

    // Add a number list
    await page.locator('.bn-block-outer').last().click();
    await page.keyboard.press('Enter');
    await page.locator('.bn-block-outer').last().fill('Test Number 1');
    await page.getByText('Test Number 1').dblclick();
    await page
      .getByRole('button', {
        name: 'Paragraph',
      })
      .click();
    await page
      .getByRole('menuitem', {
        name: 'Numbered List',
      })
      .click();
    await page
      .locator('.bn-block-content[data-content-type="numberedListItem"]')
      .last()
      .click();
    await page.keyboard.press('Enter');
    await page
      .locator('.bn-block-content[data-content-type="numberedListItem"] p')
      .last()
      .fill('Test Number 2');
    await page.keyboard.press('Enter');
    await page
      .locator('.bn-block-content[data-content-type="numberedListItem"] p')
      .last()
      .fill('Test Number 3');

    // Add img
    await page.locator('.bn-block-outer').last().click();
    await page.keyboard.press('Enter');
    await page.locator('.bn-block-outer').last().fill('/');
    await page
      .getByRole('option', {
        name: 'Image',
      })
      .click();
    await page
      .getByPlaceholder('Enter URL')
      .fill('https://example.com/image.jpg');
    await page
      .getByRole('button', {
        name: 'Embed image',
      })
      .click();

    // Download
    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Export',
      })
      .click();

    await page
      .getByRole('button', {
        name: 'Download',
      })
      .click();

    // Empty paragraph should be replaced by a <br/>
    expect(body.match(/<br>/g)?.length).toBeGreaterThanOrEqual(2);
    expect(body).toContain('style="color: orange;"');
    expect(body).toContain('custom-style="center"');
    expect(body).toContain('style="background-color: brown;"');

    const { JSDOM } = jsdom;
    const DOMParser = new JSDOM().window.DOMParser;
    const parser = new DOMParser();
    const html = parser.parseFromString(body, 'text/html');

    const ulLis = html.querySelectorAll('ul li');
    expect(ulLis.length).toBe(3);
    expect(ulLis[0].textContent).toBe('Test List 1');
    expect(ulLis[1].textContent).toBe('Test List 2');
    expect(ulLis[2].textContent).toBe('Test List 3');

    const olLis = html.querySelectorAll('ol li');
    expect(olLis.length).toBe(3);
    expect(olLis[0].textContent).toBe('Test Number 1');
    expect(olLis[1].textContent).toBe('Test Number 2');
    expect(olLis[2].textContent).toBe('Test Number 3');

    const img = html.querySelectorAll('img');
    expect(img.length).toBe(1);
    expect(img[0].src).toBe('https://example.com/image.jpg');
  });
});
