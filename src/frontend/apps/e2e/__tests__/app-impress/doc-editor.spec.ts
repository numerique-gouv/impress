import path from 'path';

import { expect, test } from '@playwright/test';

import { createDoc, goToGridDoc, mockedDocument } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Editor', () => {
  test('checks the Doc is connected to the provider server', async ({
    page,
    browserName,
  }) => {
    const webSocketPromise = page.waitForEvent('websocket', (webSocket) => {
      return webSocket.url().includes('ws://localhost:4444/');
    });

    const randomDoc = await createDoc(page, 'doc-editor', browserName, 1);
    await expect(page.locator('h2').getByText(randomDoc[0])).toBeVisible();

    const webSocket = await webSocketPromise;
    expect(webSocket.url()).toContain('ws://localhost:4444/');

    const framesentPromise = webSocket.waitForEvent('framesent');

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');

    const framesent = await framesentPromise;
    expect(framesent.payload).not.toBeNull();
  });

  test('markdown button converts from markdown to the editor syntax json', async ({
    page,
    browserName,
  }) => {
    const randomDoc = await createDoc(page, 'doc-markdown', browserName, 1);

    await expect(page.locator('h2').getByText(randomDoc[0])).toBeVisible();

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

  test('it renders correctly when we switch from one doc to another', async ({
    page,
  }) => {
    // Check the first doc
    const firstDoc = await goToGridDoc(page);
    await expect(page.locator('h2').getByText(firstDoc)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World Doc 1');
    await expect(page.getByText('Hello World Doc 1')).toBeVisible();

    // Check the second doc
    const secondDoc = await goToGridDoc(page, {
      nthRow: 2,
    });
    await expect(page.locator('h2').getByText(secondDoc)).toBeVisible();
    await expect(page.getByText('Hello World Doc 1')).toBeHidden();
    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World Doc 2');
    await expect(page.getByText('Hello World Doc 2')).toBeVisible();

    // Check the first doc again
    await goToGridDoc(page, {
      title: firstDoc,
    });
    await expect(page.locator('h2').getByText(firstDoc)).toBeVisible();
    await expect(page.getByText('Hello World Doc 2')).toBeHidden();
    await expect(page.getByText('Hello World Doc 1')).toBeVisible();
  });

  test('it saves the doc when we change pages', async ({ page }) => {
    // Check the first doc
    const doc = await goToGridDoc(page);
    await expect(page.locator('h2').getByText(doc)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page
      .locator('.ProseMirror.bn-editor')
      .fill('Hello World Doc persisted 1');
    await expect(page.getByText('Hello World Doc persisted 1')).toBeVisible();

    const secondDoc = await goToGridDoc(page, {
      nthRow: 2,
    });

    await expect(page.locator('h2').getByText(secondDoc)).toBeVisible();

    await goToGridDoc(page, {
      title: doc,
    });

    await expect(page.getByText('Hello World Doc persisted 1')).toBeVisible();
  });

  test('it saves the doc when we quit pages', async ({ page, browserName }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName === 'webkit', 'This test is very flaky with webkit');

    // Check the first doc
    const doc = await goToGridDoc(page);
    await expect(page.locator('h2').getByText(doc)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page
      .locator('.ProseMirror.bn-editor')
      .fill('Hello World Doc persisted 2');
    await expect(page.getByText('Hello World Doc persisted 2')).toBeVisible();

    await page.goto('/');

    await goToGridDoc(page, {
      title: doc,
    });

    await expect(page.getByText('Hello World Doc persisted 2')).toBeVisible();
  });

  test('it cannot edit if viewer', async ({ page }) => {
    await mockedDocument(page, {
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
    });

    await goToGridDoc(page);

    await expect(
      page.getByText('Read only, you cannot edit this document.'),
    ).toBeVisible();
  });

  test('it adds an image to the doc editor', async ({ page }) => {
    await goToGridDoc(page);

    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('.bn-block-outer').last().fill('Hello World');

    await page.keyboard.press('Enter');
    await page.locator('.bn-block-outer').last().fill('/');
    await page.getByText('Resizable image with caption').click();
    await page.getByText('Upload image').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(
      path.join(__dirname, 'assets/logo-suite-numerique.png'),
    );

    const image = page.getByRole('img', { name: 'logo-suite-numerique.png' });

    await expect(image).toBeVisible();

    // Check src of image
    expect(await image.getAttribute('src')).toMatch(
      /http:\/\/localhost:8083\/media\/.*\/attachments\/.*.png/,
    );
  });
});
