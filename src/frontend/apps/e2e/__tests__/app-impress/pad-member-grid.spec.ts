import { expect, test } from '@playwright/test';

import { createPad } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Document grid members', () => {
  test('it display the grid', async ({ page, browserName }) => {
    await createPad(page, 'grid-display', browserName, 1);

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Manage members' }).click();

    await expect(page.getByText('Members of the document')).toBeVisible();
    const table = page.getByLabel('List members card').getByRole('table');
    const thead = table.locator('thead');
    await expect(thead.getByText(/Emails/i)).toBeVisible();
    await expect(thead.getByText(/Roles/i)).toBeVisible();

    const cells = table.getByRole('row').nth(1).getByRole('cell');
    await expect(cells.nth(0)).toHaveText(`user@${browserName}.e2e`);
    await expect(cells.nth(1)).toHaveText(/Owner/i);
    await expect(cells.nth(2)).toHaveAccessibleName(
      'Open the member options modal',
    );
  });

  test('it display the grid with many members', async ({
    page,
    browserName,
  }) => {
    await page.route('**/documents/*/', async (route) => {
      const request = route.request();
      if (
        request.method().includes('GET') &&
        !request.url().includes('page=')
      ) {
        await route.fulfill({
          json: {
            id: 'b0df4343-c8bd-4c20-9ff6-fbf94fc94egg',
            content: '',
            title: 'Mocked document',
            accesses: [],
            abilities: {
              destroy: true,
              manage_accesses: true,
              partial_update: true,
            },
            is_public: false,
          },
        });
      } else {
        await route.continue();
      }
    });

    await page.route(
      '**/documents/b0df4343-c8bd-4c20-9ff6-fbf94fc94egg/accesses/?page=*',
      async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const pageId = url.searchParams.get('page');
        const accesses = {
          count: 100,
          next: null,
          previous: null,
          results: Array.from({ length: 20 }, (_, i) => ({
            id: `2ff1ec07-86c1-4534-a643-f41824a6c53a-${pageId}-${i}`,
            user: {
              id: `fc092149-cafa-4ffa-a29d-e4b18af751-${pageId}-${i}`,
              email: `impress@impress.world-page-${pageId}-${i}`,
            },
            team: '',
            role: 'owner',
            abilities: {
              destroy: false,
              partial_update: true,
            },
          })),
        };

        if (request.method().includes('GET')) {
          await route.fulfill({
            json: accesses,
          });
        } else {
          await route.continue();
        }
      },
    );

    await createPad(page, 'grid-no-member', browserName, 1);

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Manage members' }).click();

    await expect(
      page.getByText('impress@impress.world-page-1-19'),
    ).toBeVisible();

    await page.getByLabel('Go to page 4').click();

    await expect(
      page.getByText('impress@impress.world-page-1-19'),
    ).toBeHidden();

    await expect(
      page.getByText('impress@impress.world-page-4-19'),
    ).toBeVisible();
  });
});
