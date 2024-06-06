import { expect, test } from '@playwright/test';

import { waitForElementCount } from '../helpers';

import { createPad } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Documents Panel', () => {
  test('checks all the elements are visible', async ({ page }) => {
    const panel = page.getByLabel('Documents panel').first();

    await expect(panel.getByText('Documents')).toBeVisible();

    await expect(
      panel.getByRole('button', {
        name: 'Sort the documents',
      }),
    ).toBeVisible();

    await expect(
      panel.getByRole('button', {
        name: 'Add a document',
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

    const panel = page.getByLabel('Documents panel').first();

    await panel
      .getByRole('button', {
        name: 'Sort the documents by creation date ascendent',
      })
      .click();

    const responseSortAsc = await responsePromiseSortAsc;
    expect(responseSortAsc.ok()).toBeTruthy();

    await panel
      .getByRole('button', {
        name: 'Sort the documents by creation date descendent',
      })
      .click();

    const responseSortDesc = await responsePromiseSortDesc;
    expect(responseSortDesc.ok()).toBeTruthy();
  });

  test('checks the infinite scroll', async ({ page }) => {
    await page.route(
      /.*\/documents\/\?page=.*&ordering=-created_at/,
      async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const pageId = url.searchParams.get('page');
        const documents = {
          count: 40,
          next: 'http://localhost:3000/documents/?page=2&ordering=-created_at',
          previous: null,
          results: Array.from({ length: 20 }, (_, i) => ({
            id: `2ff-${pageId}-${i}`,
            title: `My document-${pageId}-${i}`,
            accesses: [
              {
                id: 'b644e9b1-0517-4cfb-90ca-f7d6f2f6bb9a',
                role: `owner`,
                team: '',
                user: {
                  id: 'a4743608-c9d8-4692-bef4-f795e25a3a88',
                  email: 'user@chromium.e2e',
                },
              },
            ],
            content: '',
            is_public: true,
            abilities: {},
          })),
        };

        if (request.method().includes('GET')) {
          await route.fulfill({
            json: documents,
          });
        } else {
          await route.continue();
        }
      },
    );

    await page.route(`**/documents/2ff-1-16/`, async (route) => {
      const request = route.request();

      if (request.method().includes('GET')) {
        await route.fulfill({
          json: {
            id: '2ff-1-16',
            title: 'My document-1-16',
            content: '',
            abilities: {
              partial_update: true,
            },
            accesses: [
              {
                id: 'b644e9b1-0517-4cfb-90ca-f7d6f2f6bb9a',
                role: `owner`,
                team: '',
                user: {
                  id: 'a4743608-c9d8-4692-bef4-f795e25a3a88',
                  email: '',
                },
              },
            ],
          },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    const panel = page.getByLabel('Documents panel').first();
    await expect(panel.locator('li')).toHaveCount(20);
    await panel.getByText(`My document-1-16`).click();

    await waitForElementCount(panel.locator('li'), 21, 10000);
    expect(await panel.locator('li').count()).toBeGreaterThan(20);
    await expect(panel.getByText(`My document-1-16`)).toBeVisible();
    await expect(panel.getByText(`My document-2-15`)).toBeVisible();
  });

  test('checks the hover and selected state', async ({ page, browserName }) => {
    const panel = page.getByLabel('Documents panel').first();
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
