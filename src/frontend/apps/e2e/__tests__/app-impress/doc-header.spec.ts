import { expect, test } from '@playwright/test';

import { goToGridDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Header', () => {
  test('it checks the element are correctly displayed', async ({ page }) => {
    await page.route('**/documents/**/', async (route) => {
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
            accesses: [
              {
                id: 'b0df4343-c8bd-4c20-9ff6-fbf94fc94egg',
                role: 'owner',
                user: {
                  email: 'super@owner.com',
                },
              },
              {
                id: 'b0df4343-c8bd-4c20-9ff6-fbf94fc94egg',
                role: 'admin',
                user: {
                  email: 'super@admin.com',
                },
              },
              {
                id: 'b0df4343-c8bd-4c20-9ff6-fbf94fc94egg',
                role: 'owner',
                user: {
                  email: 'super2@owner.com',
                },
              },
            ],
            abilities: {
              destroy: true, // Means owner
              versions_destroy: true,
              versions_list: true,
              versions_retrieve: true,
              manage_accesses: true,
              update: true,
              partial_update: true,
              retrieve: true,
            },
            is_public: true,
            created_at: '2021-09-01T09:00:00Z',
          },
        });
      } else {
        await route.continue();
      }
    });

    await goToGridDoc(page);

    const card = page.getByLabel(
      'It is the card information about the document.',
    );
    await expect(card.locator('a').getByText('home')).toBeVisible();
    await expect(card.locator('h2').getByText('Mocked document')).toBeVisible();
    await expect(card.getByText('Public')).toBeVisible();
    await expect(
      card.getByText('Created at 09/01/2021, 11:00 AM'),
    ).toBeVisible();
    await expect(
      card.getByText('Owners: super@owner.com / super2@owner.com'),
    ).toBeVisible();
    await expect(card.getByText('Your role: Owner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  });
});
