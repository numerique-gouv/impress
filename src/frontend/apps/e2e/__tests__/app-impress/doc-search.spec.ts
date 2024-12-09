import { expect, test } from '@playwright/test';
import { DateTime } from 'luxon';

type SmallDoc = {
  id: string;
  title: string;
  updated_at: string;
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Document search', () => {
  test('it checks all elements are visible', async ({ page }) => {
    await page.getByRole('button', { name: 'search' }).click();
    await expect(
      page.getByRole('img', { name: 'No active search' }),
    ).toBeVisible();

    await expect(
      page.getByLabel('Share modal').getByText('search'),
    ).toBeVisible();

    await expect(
      page.getByPlaceholder('Type the name of a document'),
    ).toBeVisible();
  });

  test('it checks search for a document', async ({ page }) => {
    await page.getByRole('button', { name: 'search' }).click();
    await page.getByPlaceholder('Type the name of a document').click();
    await page.getByPlaceholder('Type the name of a document').fill('My');

    await page.route('**/documents/**', async (route) => {
      const request = route.request();
      if (request.method().includes('GET') && request.url().includes('page=')) {
        await route.fulfill({
          json: {
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                id: 'b7fd9d9b-0642-4b4f-8617-ce50f69519ed',
                title: 'My mocked document',
                accesses: [
                  {
                    id: '8c1e047a-24e7-4a80-942b-8e9c7ab43e1f',
                    user: {
                      id: '7380f42f-02eb-4ad5-b8f0-037a0e66066d',
                      email: 'test@test.test',
                      full_name: 'John Doe',
                      short_name: 'John',
                    },
                    team: '',
                    role: 'owner',
                    abilities: {
                      destroy: false,
                      update: false,
                      partial_update: false,
                      retrieve: true,
                      set_role_to: [],
                    },
                  },
                ],
                abilities: {
                  attachment_upload: true,
                  destroy: true,
                  link_configuration: true,
                  accesses_manage: true,
                  partial_update: true,
                  retrieve: true,
                  update: true,
                  versions_destroy: true,
                  versions_list: true,
                  versions_retrieve: true,
                },
                link_role: 'reader',
                link_reach: 'public',
                created_at: '2024-10-07T13:02:41.085298Z',
                updated_at: '2024-10-07T13:30:21.829690Z',
              },
              {
                id: 'b7fd9d9b-0642-4b4f-8617-ce50f69519ef',
                title: 'My mocked document 2',
                accesses: [
                  {
                    id: '8c1e047a-24e7-4a80-942b-8e9c7ab43e1f',
                    user: {
                      id: '7380f42f-02eb-4ad5-b8f0-037a0e66066d',
                      email: 'test@test.test',
                      full_name: 'John Doe',
                      short_name: 'John',
                    },
                    team: '',
                    role: 'owner',
                    abilities: {
                      destroy: false,
                      update: false,
                      partial_update: false,
                      retrieve: true,
                      set_role_to: [],
                    },
                  },
                ],
                abilities: {
                  attachment_upload: true,
                  destroy: true,
                  link_configuration: true,
                  accesses_manage: true,
                  partial_update: true,
                  retrieve: true,
                  update: true,
                  versions_destroy: true,
                  versions_list: true,
                  versions_retrieve: true,
                },
                link_role: 'reader',
                link_reach: 'public',
                created_at: '2024-10-07T13:02:41.085298Z',
                updated_at: '2024-10-07T13:30:21.829690Z',
              },
            ],
          },
        });
      } else {
        await route.continue();
      }
    });
    const responsePromisePage2 = page.waitForResponse(
      (response) =>
        response.url().includes(`/documents/?page=1&title=My`) &&
        response.status() === 200,
    );
    const response = await responsePromisePage2;
    const result = (await response.json()) as { results: SmallDoc[] };
    const docs = result.results;

    await Promise.all(
      docs.map(async (doc: SmallDoc) => {
        await expect(
          page.getByTestId(`doc-search-item-${doc.id}`),
        ).toBeVisible();
        const updatedAt = DateTime.fromISO(doc.updated_at ?? DateTime.now())
          .setLocale('en')
          .toRelative();
        await expect(
          page.getByTestId(`doc-search-item-${doc.id}`).getByText(updatedAt!),
        ).toBeVisible();
      }),
    );

    const firstDoc = docs[0];

    await expect(
      page
        .getByTestId(`doc-search-item-${firstDoc.id}`)
        .getByText('keyboard_return'),
    ).toBeVisible();

    await page
      .getByPlaceholder('Type the name of a document')
      .press('ArrowDown');

    const secondDoc = docs[1];
    await expect(
      page
        .getByTestId(`doc-search-item-${secondDoc.id}`)
        .getByText('keyboard_return'),
    ).toBeVisible();
  });
});
