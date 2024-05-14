import { expect, test } from '@playwright/test';

import { waitForElementCount } from '../helpers';

import { createPad, keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Pads Panel', () => {
  test('checks all the elements are visible', async ({ page }) => {
    const panel = page.getByLabel('Pads panel').first();

    await expect(panel.getByText('Documents')).toBeVisible();

    await expect(
      panel.getByRole('button', {
        name: 'Sort the pads',
      }),
    ).toBeVisible();

    await expect(
      panel.getByRole('button', {
        name: 'Add a pad',
      }),
    ).toBeVisible();
  });

  test('checks the sort button', async ({ page }) => {
    const responsePromiseSortDesc = page.waitForResponse(
      (response) =>
        response.url().includes('/documents/?page=1&ordering=-created_at') &&
        response.status() === 200,
    );

    const responsePromiseSortAsc = page.waitForResponse(
      (response) =>
        response.url().includes('/documents/?page=1&ordering=created_at') &&
        response.status() === 200,
    );

    const panel = page.getByLabel('Pads panel').first();

    await panel
      .getByRole('button', {
        name: 'Sort the pads by creation date ascendent',
      })
      .click();

    const responseSortAsc = await responsePromiseSortAsc;
    expect(responseSortAsc.ok()).toBeTruthy();

    await panel
      .getByRole('button', {
        name: 'Sort the pads by creation date descendent',
      })
      .click();

    const responseSortDesc = await responsePromiseSortDesc;
    expect(responseSortDesc.ok()).toBeTruthy();
  });

  test('checks the infinite scroll', async ({ page, browserName }) => {
    test.setTimeout(90000);
    const panel = page.getByLabel('Pads panel').first();

    const randomPads = await createPad(page, 'pad-infinite', browserName, 40);

    await expect(panel.locator('li')).toHaveCount(20);
    await panel.getByText(randomPads[24]).click();

    await waitForElementCount(panel.locator('li'), 21, 10000);
    expect(await panel.locator('li').count()).toBeGreaterThan(20);
  });

  test('checks the hover and selected state', async ({ page, browserName }) => {
    const panel = page.getByLabel('Pads panel').first();
    await createPad(page, 'pad-hover', browserName, 2);

    const selectedPad = panel.locator('li').nth(0);
    await expect(selectedPad).toHaveCSS(
      'background-color',
      'rgb(202, 202, 251)',
    );

    const hoverPad = panel.locator('li').nth(1);
    await hoverPad.hover();
    await expect(hoverPad).toHaveCSS('background-color', 'rgb(227, 227, 253)');
  });
});
