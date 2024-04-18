import { expect, test } from '@playwright/test';

import { keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Menu', () => {
  const menuItems = [
    { name: 'Pad', isDefault: true },
    { name: 'Template', isDefault: false },
  ];
  for (const { name, isDefault } of menuItems) {
    test(`checks that ${name} menu item is displaying correctly`, async ({
      page,
    }) => {
      const menu = page.locator('menu').first();

      const buttonMenu = menu.getByLabel(`${name} button`);
      await expect(buttonMenu).toBeVisible();
      await buttonMenu.hover();
      await expect(menu.getByLabel('tooltip')).toHaveText(name);

      // Checks the tooltip is with inactive color
      await expect(menu.getByLabel('tooltip')).toHaveCSS(
        'background-color',
        isDefault ? 'rgb(255, 255, 255)' : 'rgb(22, 22, 22)',
      );

      await buttonMenu.click();

      // Checks the tooltip has active color
      await buttonMenu.hover();
      await expect(menu.getByLabel('tooltip')).toHaveCSS(
        'background-color',
        'rgb(255, 255, 255)',
      );
    });

    test(`checks that ${name} menu item is routing correctly`, async ({
      page,
    }) => {
      await expect(
        page.getByRole('button', {
          name: 'Create a new pad',
        }),
      ).toBeVisible();

      const menu = page.locator('menu').first();

      const buttonMenu = menu.getByLabel(`${name} button`);
      await buttonMenu.click();

      /* eslint-disable playwright/no-conditional-expect */
      /* eslint-disable playwright/no-conditional-in-test */
      if (isDefault) {
        await expect(
          page.getByRole('button', {
            name: 'Create a new pad',
          }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole('button', {
            name: 'Create a new pad',
          }),
        ).toBeHidden();

        const reg = new RegExp(name.toLowerCase());
        await expect(page).toHaveURL(reg);
      }
      /* eslint-enable playwright/no-conditional-expect */
      /* eslint-enable playwright/no-conditional-in-test */
    });
  }
});
