import { expect, test } from '@playwright/test';

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

    const panel = page.getByLabel('Documents panel').first();

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

  test('it saves the doc when we change pages', async ({
    page,
    browserName,
  }) => {
    const [pad] = await createPad(page, 'pad-save-page', browserName, 1);

    const panel = page.getByLabel('Documents panel').first();

    // Check the first pad
    await panel.getByText(pad).click();
    await expect(page.locator('h2').getByText(pad)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page
      .locator('.ProseMirror.bn-editor')
      .fill('Hello World Pad persisted 1');
    await expect(page.getByText('Hello World Pad persisted 1')).toBeVisible();

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

    await panel.getByText(pad).click();

    await expect(page.getByText('Hello World Pad persisted 1')).toBeVisible();
  });

  test('it saves the doc when we quit pages', async ({ page, browserName }) => {
    const [pad] = await createPad(page, 'pad-save-quit', browserName, 1);

    const panel = page.getByLabel('Documents panel').first();

    // Check the first pad
    await panel.getByText(pad).click();
    await expect(page.locator('h2').getByText(pad)).toBeVisible();
    await page.locator('.ProseMirror.bn-editor').click();
    await page
      .locator('.ProseMirror.bn-editor')
      .fill('Hello World Pad persisted 2');
    await expect(page.getByText('Hello World Pad persisted 2')).toBeVisible();

    await page.goto('/');

    await panel.getByText(pad).click();

    await expect(page.getByText('Hello World Pad persisted 2')).toBeVisible();
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

    await createPad(page, 'pad-right-edit', browserName, 1);

    await expect(
      page.getByText(
        "Read only, you don't have the right to update this document.",
      ),
    ).toBeVisible();
  });
});
