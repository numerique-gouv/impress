import { expect, test } from '@playwright/test';

import { createDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Editor', () => {
  test('checks the Doc Editor interact correctly', async ({
    page,
    browserName,
  }) => {
    const randomDoc = await createDoc(page, 'doc-editor', browserName, 1);

    await expect(page.locator('h2').getByText(randomDoc[0])).toBeVisible();

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');
    await expect(page.getByText('Hello World')).toBeVisible();
  });

  test('checks the Doc is connected to the webrtc server', async ({
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
    browserName,
  }) => {
    const [firstDoc, secondDoc] = await createDoc(
      page,
      'doc-multiple',
      browserName,
      2,
    );

    const panel = page.getByLabel('Documents panel').first();

    // Check the first doc
    await panel.getByText(firstDoc).click();
    await expect(page.locator('h2').getByText(firstDoc)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World Doc 1');
    await expect(page.getByText('Hello World Doc 1')).toBeVisible();

    // Check the second doc
    await panel.getByText(secondDoc).click();
    await expect(page.locator('h2').getByText(secondDoc)).toBeVisible();
    await expect(page.getByText('Hello World Doc 1')).toBeHidden();
    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World Doc 2');
    await expect(page.getByText('Hello World Doc 2')).toBeVisible();

    // Check the first doc again
    await panel.getByText(firstDoc).click();
    await expect(page.locator('h2').getByText(firstDoc)).toBeVisible();
    await expect(page.getByText('Hello World Doc 2')).toBeHidden();
    await expect(page.getByText('Hello World Doc 1')).toBeVisible();
  });

  test('it saves the doc when we change pages', async ({
    page,
    browserName,
  }) => {
    const [doc] = await createDoc(page, 'doc-save-page', browserName, 1);

    const panel = page.getByLabel('Documents panel').first();

    // Check the first doc
    await panel.getByText(doc).click();
    await expect(page.locator('h2').getByText(doc)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page
      .locator('.ProseMirror.bn-editor')
      .fill('Hello World Doc persisted 1');
    await expect(page.getByText('Hello World Doc persisted 1')).toBeVisible();

    await panel
      .getByRole('button', {
        name: 'Add a document',
      })
      .click();

    const card = page.getByLabel('Create new document card').first();
    await expect(
      card.getByRole('heading', {
        name: 'Name the document',
        level: 3,
      }),
    ).toBeVisible();

    await page.goto('/');

    await panel.getByText(doc).click();

    await expect(page.getByText('Hello World Doc persisted 1')).toBeVisible();
  });

  test('it saves the doc when we quit pages', async ({ page, browserName }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName === 'webkit', 'This test is very flaky with webkit');

    const [doc] = await createDoc(page, 'doc-save-quit', browserName, 1);

    const panel = page.getByLabel('Documents panel').first();

    // Check the first doc
    await panel.getByText(doc).click();
    await expect(page.locator('h2').getByText(doc)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page
      .locator('.ProseMirror.bn-editor')
      .fill('Hello World Doc persisted 2');
    await expect(page.getByText('Hello World Doc persisted 2')).toBeVisible();

    await page.goto('/');

    await panel.getByText(doc).click();

    await expect(page.getByText('Hello World Doc persisted 2')).toBeVisible();
  });

  test('it cannot edit if viewer', async ({ page, browserName }) => {
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

    await createDoc(page, 'doc-right-edit', browserName, 1);

    await expect(
      page.getByText(
        "Read only, you don't have the right to update this document.",
      ),
    ).toBeVisible();
  });
});
