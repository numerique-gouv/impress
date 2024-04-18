import { expect, test } from '@playwright/test';
import cs from 'convert-stream';
import pdf from 'pdf-parse';

import { createPad, createTemplate, keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Pad Editor', () => {
  test('checks the Pad Editor interact correctly', async ({
    page,
    browserName,
  }) => {
    const randomPad = await createPad(page, 'pad-editor', browserName, 1);

    await expect(page.locator('h2').getByText(randomPad[0])).toBeVisible();

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');
    await expect(page.getByText('Hello World')).toBeVisible();
  });

  test('checks the Pad is connected to the webrtc server', async ({
    page,
    browserName,
  }) => {
    const webSocketPromise = page.waitForEvent('websocket', (webSocket) => {
      return webSocket.url().includes('ws://localhost:4444/');
    });

    const randomPad = await createPad(page, 'pad-editor', browserName, 1);
    await expect(page.locator('h2').getByText(randomPad[0])).toBeVisible();

    const webSocket = await webSocketPromise;
    expect(webSocket.url()).toBe('ws://localhost:4444/');

    const framesentPromise = webSocket.waitForEvent('framesent');

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');

    const framesent = await framesentPromise;
    const payload = JSON.parse(framesent.payload as string) as {
      type: string;
    };

    const typeCases = ['publish', 'subscribe', 'unsubscribe', 'ping'];
    expect(typeCases.includes(payload.type)).toBeTruthy();
  });

  test('markdown button converts from markdown to the editor syntax json', async ({
    page,
    browserName,
  }) => {
    const randomPad = await createPad(page, 'pad-markdown', browserName, 1);

    await expect(page.locator('h2').getByText(randomPad[0])).toBeVisible();

    await page.locator('.ProseMirror.bn-editor').click();
    await page
      .locator('.ProseMirror.bn-editor')
      .fill('[test markdown](http://test-markdown.html)');

    await expect(page.getByText('[test markdown]')).toBeVisible();

    await page.getByText('[test markdown]').dblclick();
    await page.locator('button[data-test="convertMarkdown"]').click();

    await expect(page.getByText('[test markdown]')).toBeHidden();
    await expect(
      page.getByRole('link', {
        name: 'test markdown',
      }),
    ).toHaveAttribute('href', 'http://test-markdown.html');
  });

  test('it converts the pad to pdf with a template created', async ({
    page,
    browserName,
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      browserName !== 'chromium',
      'This test failed with safary because of the dragNdrop',
    );

    const downloadPromise = page.waitForEvent('download', (download) => {
      return download.suggestedFilename().includes('impress-document.pdf');
    });

    const templates = await createTemplate(
      page,
      'template-pad',
      browserName,
      1,
    );

    const iframe = page.frameLocator('iFrame.gjs-frame');
    await page.getByTitle('Open Blocks').click();
    await page
      .locator('.gjs-editor .gjs-block[title="Text"]')
      .dragTo(iframe.locator('body.gjs-dashed'));

    await iframe
      .getByText('Insert your text here')
      .fill('My template ! {{body}}');
    await iframe.locator('body.gjs-dashed').click();

    await page.getByText('Save template').click();

    const menu = page.locator('menu').first();
    await menu.getByLabel(`Pad button`).click();

    const randomPad = await createPad(page, 'pad-editor', browserName, 1);
    await expect(page.locator('h2').getByText(randomPad[0])).toBeVisible();

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('And my pad !');

    await page.getByRole('combobox', { name: 'Template' }).click();
    await page.getByRole('option', { name: templates[0] }).click();

    await page.getByText('Generate PDF').first().click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('impress-document.pdf');

    const pdfBuffer = await cs.toBuffer(await download.createReadStream());
    const pdfText = (await pdf(pdfBuffer)).text;

    expect(pdfText).toContain('My template !');
    expect(pdfText).toContain('And my pad !');
  });
});
