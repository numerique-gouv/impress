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

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('[test markdown](http://test-markdown.html)');

    await expect(editor.getByText('[test markdown]')).toBeVisible();

    await editor.getByText('[test markdown]').dblclick();
    await page.locator('button[data-test="convertMarkdown"]').click();

    await expect(editor.getByText('[test markdown]')).toBeHidden();
    await expect(
      editor.getByRole('link', {
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

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('Hello World Doc 1');
    await expect(editor.getByText('Hello World Doc 1')).toBeVisible();

    // Check the second doc
    const secondDoc = await goToGridDoc(page, {
      nthRow: 2,
    });
    await expect(page.locator('h2').getByText(secondDoc)).toBeVisible();
    await expect(editor.getByText('Hello World Doc 1')).toBeHidden();
    await editor.click();
    await editor.fill('Hello World Doc 2');
    await expect(editor.getByText('Hello World Doc 2')).toBeVisible();

    // Check the first doc again
    await goToGridDoc(page, {
      title: firstDoc,
    });
    await expect(page.locator('h2').getByText(firstDoc)).toBeVisible();
    await expect(editor.getByText('Hello World Doc 2')).toBeHidden();
    await expect(editor.getByText('Hello World Doc 1')).toBeVisible();
  });

  test('it saves the doc when we change pages', async ({ page }) => {
    // Check the first doc
    const doc = await goToGridDoc(page);
    await expect(page.locator('h2').getByText(doc)).toBeVisible();

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('Hello World Doc persisted 1');
    await expect(editor.getByText('Hello World Doc persisted 1')).toBeVisible();

    const secondDoc = await goToGridDoc(page, {
      nthRow: 2,
    });

    await expect(page.locator('h2').getByText(secondDoc)).toBeVisible();

    await goToGridDoc(page, {
      title: doc,
    });

    await expect(editor.getByText('Hello World Doc persisted 1')).toBeVisible();
  });

  test('it saves the doc when we quit pages', async ({ page, browserName }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName === 'webkit', 'This test is very flaky with webkit');

    // Check the first doc
    const doc = await goToGridDoc(page);
    await expect(page.locator('h2').getByText(doc)).toBeVisible();

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('Hello World Doc persisted 2');
    await expect(editor.getByText('Hello World Doc persisted 2')).toBeVisible();

    await page.goto('/');

    await goToGridDoc(page, {
      title: doc,
    });

    await expect(editor.getByText('Hello World Doc persisted 2')).toBeVisible();
  });

  test('it cannot edit if viewer', async ({ page }) => {
    await mockedDocument(page, {
      abilities: {
        destroy: false, // Means not owner
        link_configuration: false,
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

  test('it checks the AI buttons', async ({ page, browserName }) => {
    await page.route(/.*\/ai-translate\//, async (route) => {
      const request = route.request();
      if (request.method().includes('POST')) {
        await route.fulfill({
          json: {
            answer: 'Bonjour le monde',
          },
        });
      } else {
        await route.continue();
      }
    });

    await createDoc(page, 'doc-ai', browserName, 1);

    await page.locator('.bn-block-outer').last().fill('Hello World');

    const editor = page.locator('.ProseMirror');
    await editor.getByText('Hello').dblclick();

    await page.getByRole('button', { name: 'AI' }).click();

    await expect(
      page.getByRole('menuitem', { name: 'Use as prompt' }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Rephrase' }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Summarize' }),
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Correct' })).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Language' }),
    ).toBeVisible();

    await page.getByRole('menuitem', { name: 'Language' }).hover();
    await expect(
      page.getByRole('menuitem', { name: 'English', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'French', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'German', exact: true }),
    ).toBeVisible();

    await page.getByRole('menuitem', { name: 'English', exact: true }).click();

    await expect(editor.getByText('Bonjour le monde')).toBeVisible();
  });
});
