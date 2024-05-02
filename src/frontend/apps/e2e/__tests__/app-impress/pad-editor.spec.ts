import { expect, test } from '@playwright/test';
import cs from 'convert-stream';
import pdf from 'pdf-parse';

import { createPad, keyCloakSignIn } from './common';

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

  test('it converts the pad to pdf with a template integrated', async ({
    page,
    browserName,
  }) => {
    const downloadPromise = page.waitForEvent('download', (download) => {
      return download.suggestedFilename().includes('impress-document.pdf');
    });

    const randomPad = await createPad(page, 'pad-editor', browserName, 1);
    await expect(page.locator('h2').getByText(randomPad[0])).toBeVisible();

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');

    await page.getByText('Generate PDF').first().click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('impress-document.pdf');

    const pdfBuffer = await cs.toBuffer(await download.createReadStream());
    const pdfText = (await pdf(pdfBuffer)).text;

    expect(pdfText).toContain('Monsieur le Premier Ministre'); // This is the template text
    expect(pdfText).toContain('La directrice'); // This is the template text
    expect(pdfText).toContain('Hello World'); // This is the pad text
  });

  test('it renders correctly when we switch from one pad to another', async ({
    page,
    browserName,
  }) => {
    const [firstPad, secondPad] = await createPad(
      page,
      'pad-multiple',
      browserName,
      2,
    );

    const panel = page.getByLabel('Pads panel').first();

    // Check the first pad
    await panel.getByText(firstPad).click();
    await expect(page.locator('h2').getByText(firstPad)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World Pad 1');
    await expect(page.getByText('Hello World Pad 1')).toBeVisible();

    // Check the second pad
    await panel.getByText(secondPad).click();
    await expect(page.locator('h2').getByText(secondPad)).toBeVisible();
    await expect(page.getByText('Hello World Pad 1')).toBeHidden();
    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World Pad 2');
    await expect(page.getByText('Hello World Pad 2')).toBeVisible();

    // Check the first pad again
    await panel.getByText(firstPad).click();
    await expect(page.locator('h2').getByText(firstPad)).toBeVisible();
    await expect(page.getByText('Hello World Pad 2')).toBeHidden();
    await expect(page.getByText('Hello World Pad 1')).toBeVisible();
  });
});
