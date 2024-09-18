import { expect, test } from '@playwright/test';

import { createDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Table Content', () => {
  test('it checks the doc table content', async ({ page, browserName }) => {
    const [randomDoc] = await createDoc(
      page,
      'doc-table-content',
      browserName,
      1,
    );

    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Table of contents',
      })
      .click();

    const panel = page.getByLabel('Document panel');
    const editor = page.locator('.ProseMirror');

    await editor.locator('.bn-block-outer').last().fill('/');
    await page.getByText('Heading 1').click();
    await page.keyboard.type('Hello World');
    await editor.getByText('Hello').dblclick();
    await page.getByRole('button', { name: 'Strike' }).click();

    await page.locator('.bn-block-outer').last().click();

    // Create space to fill the viewport
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Enter');
    }

    await editor.locator('.bn-block-outer').last().fill('/');
    await page.getByText('Heading 2').click();
    await page.keyboard.type('Super World', { delay: 100 });

    await page.locator('.bn-block-outer').last().click();

    // Create space to fill the viewport
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Enter');
    }

    await editor.locator('.bn-block-outer').last().fill('/');
    await page.getByText('Heading 3').click();
    await page.keyboard.type('Another World');

    const hello = panel.getByText('Hello World');
    const superW = panel.getByText('Super World');
    const another = panel.getByText('Another World');

    await expect(hello).toBeVisible();
    await expect(hello).toHaveCSS('font-size', /19/);
    await expect(hello).toHaveAttribute('aria-selected', 'true');

    await expect(superW).toBeVisible();
    await expect(superW).toHaveCSS('font-size', /16/);
    await expect(superW).toHaveAttribute('aria-selected', 'false');

    await expect(another).toBeVisible();
    await expect(another).toHaveCSS('font-size', /12/);
    await expect(another).toHaveAttribute('aria-selected', 'false');

    await hello.click();

    await expect(editor.getByText('Hello World')).toBeInViewport();
    await expect(hello).toHaveAttribute('aria-selected', 'true');
    await expect(superW).toHaveAttribute('aria-selected', 'false');

    await another.click();

    await expect(editor.getByText('Hello World')).not.toBeInViewport();
    await expect(hello).toHaveAttribute('aria-selected', 'false');
    await expect(superW).toHaveAttribute('aria-selected', 'true');

    await panel.getByText('Back to top').click();
    await expect(editor.getByText('Hello World')).toBeInViewport();
    await expect(hello).toHaveAttribute('aria-selected', 'true');
    await expect(superW).toHaveAttribute('aria-selected', 'false');

    await panel.getByText('Go to bottom').click();
    await expect(editor.getByText('Hello World')).not.toBeInViewport();
    await expect(superW).toHaveAttribute('aria-selected', 'true');
  });
});
