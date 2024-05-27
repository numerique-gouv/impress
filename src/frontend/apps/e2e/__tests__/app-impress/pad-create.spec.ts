import { expect, test } from '@playwright/test';

import { keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Pad Create', () => {
  test('checks all the create pad elements are visible', async ({ page }) => {
    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new document',
    });
    await buttonCreateHomepage.click();
    await expect(buttonCreateHomepage).toBeHidden();

    const card = page.getByLabel('Create new document card').first();

    await expect(card.getByLabel('Document name')).toBeVisible();

    await expect(card.getByLabel('icon group')).toBeVisible();

    await expect(
      card.getByRole('heading', {
        name: 'Name the document',
        level: 3,
      }),
    ).toBeVisible();

    await expect(card.getByText('Is it public ?')).toBeVisible();

    await expect(
      card.getByRole('button', {
        name: 'Create the document',
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
      name: 'Create a new document',
    });
    await buttonCreateHomepage.click();
    await expect(buttonCreateHomepage).toBeHidden();

    const card = page.getByLabel('Create new document card').first();

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
    const panel = page.getByLabel('Documents panel').first();

    await panel.getByRole('button', { name: 'Add a document' }).click();

    const padName = `My routing pad ${browserName}-${Math.floor(Math.random() * 1000)}`;
    await page.getByText('Document name').fill(padName);
    await page.getByRole('button', { name: 'Create the document' }).click();

    const elPad = page.locator('h2').getByText(padName);
    await expect(elPad).toBeVisible();

    await panel.getByRole('button', { name: 'Add a document' }).click();
    await expect(elPad).toBeHidden();

    await panel.locator('li').getByText(padName).click();
    await expect(elPad).toBeVisible();
  });

  test('checks alias pads url with homepage', async ({ page }) => {
    await expect(page).toHaveURL('/');

    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new document',
    });

    await expect(buttonCreateHomepage).toBeVisible();

    await page.goto('/docs');
    await expect(buttonCreateHomepage).toBeVisible();
    await expect(page).toHaveURL(/\/docs$/);
  });

  test('checks 404 on docs/[id] page', async ({ page }) => {
    await page.goto('/docs/some-unknown-pad');
    await expect(
      page.getByText(
        'It seems that the page you are looking for does not exist or cannot be displayed correctly.',
      ),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test('checks that the pad is public', async ({ page, browserName }) => {
    const responsePromisePad = page.waitForResponse(
      (response) =>
        response.url().includes('/documents/') && response.status() === 201,
    );

    const panel = page.getByLabel('Documents panel').first();

    await panel.getByRole('button', { name: 'Add a document' }).click();

    const padName = `My routing pad ${browserName}-${Math.floor(Math.random() * 1000)}`;
    await page.getByText('Document name').fill(padName);
    await page.getByText('Is it public ?').click();
    await page.getByRole('button', { name: 'Create the document' }).click();

    const responsePad = await responsePromisePad;
    const is_public = (await responsePad.json()).is_public;
    expect(is_public).toBeTruthy();
  });
});
