import { expect, test } from '@playwright/test';

import { createDoc, goToGridDoc, mockedDocument } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Version', () => {
  test('it displays the doc versions', async ({ page, browserName }) => {
    const [randomDoc] = await createDoc(page, 'doc-version', browserName, 1);

    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    const panel = page.getByLabel('Document version panel');

    await expect(panel.getByText('Current version')).toBeVisible();
    expect(await panel.locator('li').count()).toBe(1);

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').last().fill('Hello World');

    await goToGridDoc(page, {
      title: randomDoc,
    });

    await expect(page.getByText('Hello World')).toBeVisible();

    await page
      .locator('.ProseMirror.bn-editor')
      .last()
      .fill('It will create a version');

    await goToGridDoc(page, {
      title: randomDoc,
    });

    await expect(page.getByText('Hello World')).toBeHidden();
    await expect(page.getByText('It will create a version')).toBeVisible();

    await expect(panel.getByText('Current version')).toBeVisible();
    expect(await panel.locator('li').count()).toBe(2);

    await panel.locator('li').nth(1).click();
    await expect(
      page.getByText('Read only, you cannot edit document versions.'),
    ).toBeVisible();
    await expect(page.getByText('Hello World')).toBeVisible();
    await expect(page.getByText('It will create a version')).toBeHidden();

    await panel.getByText('Current version').click();
    await expect(page.getByText('Hello World')).toBeHidden();
    await expect(page.getByText('It will create a version')).toBeVisible();
  });

  test('it does not display the doc versions if not allowed', async ({
    page,
  }) => {
    await mockedDocument(page, {
      abilities: {
        versions_list: false,
        partial_update: true,
      },
    });

    await goToGridDoc(page);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await expect(page.getByLabel('Document version panel')).toBeHidden();
  });

  test('it restores the doc version', async ({ page, browserName }) => {
    const [randomDoc] = await createDoc(page, 'doc-version', browserName, 1);

    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.locator('.bn-block-outer').last().click();
    await page.locator('.bn-block-outer').last().fill('Hello');

    await goToGridDoc(page, {
      title: randomDoc,
    });

    await expect(page.getByText('Hello')).toBeVisible();
    await page.locator('.bn-block-outer').last().click();
    await page.keyboard.press('Enter');
    await page.locator('.bn-block-outer').last().fill('World');

    await goToGridDoc(page, {
      title: randomDoc,
    });

    await expect(page.getByText('World')).toBeVisible();

    const panel = page.getByLabel('Document version panel');
    await panel.locator('li').nth(1).click();
    await expect(page.getByText('World')).toBeHidden();

    await panel.getByLabel('Open the version options').click();
    await page.getByText('Restore the version').click();

    await expect(panel.locator('li')).toHaveCount(3);

    await panel.getByText('Current version').click();
    await expect(page.getByText('Hello')).toBeVisible();
    await expect(page.getByText('World')).toBeHidden();
  });
});
