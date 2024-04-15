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
});
