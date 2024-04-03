import { expect, test } from '@playwright/test';

import { keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Pad Create', () => {
  test('checks all the create pad elements are visible', async ({ page }) => {
    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new pad',
    });
    await buttonCreateHomepage.click();
    await expect(buttonCreateHomepage).toBeHidden();

    const card = page.getByLabel('Create new pad card').first();

    await expect(card.getByLabel('Pad name')).toBeVisible();

    await expect(card.getByLabel('icon group')).toBeVisible();

    await expect(
      card.getByRole('heading', {
        name: 'Name the pad',
        level: 3,
      }),
    ).toBeVisible();

    await expect(
      card.getByRole('button', {
        name: 'Create the pad',
      }),
    ).toBeVisible();

    await expect(
      card.getByRole('button', {
        name: 'Cancel',
      }),
    ).toBeVisible();
  });

  test('checks the cancel button interaction', async ({ page }) => {
    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new pad',
    });
    await buttonCreateHomepage.click();
    await expect(buttonCreateHomepage).toBeHidden();

    const card = page.getByLabel('Create new pad card').first();

    await card
      .getByRole('button', {
        name: 'Cancel',
      })
      .click();

    await expect(buttonCreateHomepage).toBeVisible();
  });

  test('checks the routing on new pad created', async ({
    page,
    browserName,
  }) => {
    const panel = page.getByLabel('Pads panel').first();

    await panel.getByRole('button', { name: 'Add a pad' }).click();

    const padName = `My routing pad ${browserName}-${Math.floor(Math.random() * 1000)}`;
    await page.getByText('Pad name').fill(padName);
    await page.getByRole('button', { name: 'Create the pad' }).click();

    const elPad = page.getByText(`Members of “${padName}“`);
    await expect(elPad).toBeVisible();

    await panel.getByRole('button', { name: 'Add a pad' }).click();
    await expect(elPad).toBeHidden();

    await panel.locator('li').getByText(padName).click();
    await expect(elPad).toBeVisible();
  });

  test('checks alias pads url with homepage', async ({ page }) => {
    await expect(page).toHaveURL('/');

    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new pad',
    });

    await expect(buttonCreateHomepage).toBeVisible();

    await page.goto('/pads');
    await expect(buttonCreateHomepage).toBeVisible();
    await expect(page).toHaveURL(/\/pads$/);
  });

  test('checks error when duplicate pad', async ({ page, browserName }) => {
    const panel = page.getByLabel('Pads panel').first();

    await panel.getByRole('button', { name: 'Add a pad' }).click();

    const padName = `My duplicate pad ${browserName}-${Math.floor(Math.random() * 1000)}`;
    await page.getByText('Pad name').fill(padName);
    await page.getByRole('button', { name: 'Create the pad' }).click();

    await panel.getByRole('button', { name: 'Add a pad' }).click();

    await page.getByText('Pad name').fill(padName);
    await page.getByRole('button', { name: 'Create the pad' }).click();

    await expect(
      page.getByText('Pad with this Slug already exists.'),
    ).toBeVisible();
  });

  test('checks 404 on pads/[id] page', async ({ page }) => {
    await page.goto('/pads/some-unknown-pad');
    await expect(
      page.getByText(
        'It seems that the page you are looking for does not exist or cannot be displayed correctly.',
      ),
    ).toBeVisible({
      timeout: 15000,
    });
  });
});
