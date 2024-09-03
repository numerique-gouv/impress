import { expect, test } from '@playwright/test';

import { createDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Summary', () => {
  test('it checks the doc summary', async ({ page, browserName }) => {
    const [randomDoc] = await createDoc(page, 'doc-summary', browserName, 1);

    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Summary',
      })
      .click();

    const panel = page.getByLabel('Document panel');
    const editor = page.locator('.ProseMirror');

    await editor.locator('.bn-block-outer').last().fill('/');
    await page.getByText('Heading 1').click();
    await page.keyboard.type('Hello World');

    await page.locator('.bn-block-outer').last().click();

    // Create space to fill the viewport
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Enter');
    }

    await editor.locator('.bn-block-outer').last().fill('/');
    await page.getByText('Heading 2').click();
    await page.keyboard.type('Super World');

    await page.locator('.bn-block-outer').last().click();

    // Create space to fill the viewport
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Enter');
    }

    await editor.locator('.bn-block-outer').last().fill('/');
    await page.getByText('Heading 3').click();
    await page.keyboard.type('Another World');

    await expect(panel.getByText('Hello World')).toBeVisible();
    await expect(panel.getByText('Super World')).toBeVisible();

    await panel.getByText('Another World').click();

    await expect(editor.getByText('Hello World')).not.toBeInViewport();

    await panel.getByText('Back to top').click();
    await expect(editor.getByText('Hello World')).toBeInViewport();

    await panel.getByText('Go to bottom').click();
    await expect(editor.getByText('Hello World')).not.toBeInViewport();
  });
});
