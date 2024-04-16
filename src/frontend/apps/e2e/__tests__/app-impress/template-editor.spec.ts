import { expect, test } from '@playwright/test';

import { createTemplate, keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Template Editor', () => {
  test('checks the template editor interact correctly', async ({
    page,
    browserName,
  }) => {
    const randomTemplate = await createTemplate(
      page,
      'template-editor',
      browserName,
      1,
    );

    await expect(page.locator('h2').getByText(randomTemplate[0])).toBeVisible();

    await page.getByTitle('Open Blocks').click();
    await expect(
      page.locator('.gjs-editor .gjs-block[title="Text"]'),
    ).toBeVisible();
  });

  test('checks the template editor save on changed', async ({
    page,
    browserName,
  }) => {
    const randomTemplate = await createTemplate(
      page,
      'template-editor',
      browserName,
      1,
    );

    await expect(page.locator('h2').getByText(randomTemplate[0])).toBeVisible();

    const iframe = page.frameLocator('iFrame.gjs-frame');

    await page.getByTitle('Open Blocks').click();
    await page
      .locator('.gjs-editor .gjs-block[title="Text"]')
      .dragTo(iframe.locator('body.gjs-dashed'));

    await iframe.getByText('Insert your text here').fill('Hello World');
    await iframe.locator('body.gjs-dashed').click();

    // Come on the page again to check the changes are saved
    await page.locator('menu').first().getByLabel(`Template button`).click();
    const panel = page.getByLabel('Templates panel').first();
    await panel.locator('li').getByText(randomTemplate[0]).click();

    await expect(iframe.getByText('Hello World')).toBeVisible({
      timeout: 5000,
    });
  });
});
