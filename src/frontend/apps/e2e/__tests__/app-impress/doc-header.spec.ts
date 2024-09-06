import { expect, test } from '@playwright/test';

import { createDoc, goToGridDoc, mockedDocument } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Header', () => {
  test('it checks the element are correctly displayed', async ({ page }) => {
    await mockedDocument(page, {
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

  test('it updates the doc', async ({ page, browserName }) => {
    const [randomDoc] = await createDoc(page, 'doc-update', browserName, 1);
    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Update document',
      })
      .click();

    await expect(
      page.locator('h2').getByText(`Update document "${randomDoc}"`),
    ).toBeVisible();

    await page.getByText('Document name').fill(`${randomDoc}-updated`);

    await page
      .getByRole('button', {
        name: 'Validate the modification',
      })
      .click();

    await expect(
      page.getByText('The document has been updated.'),
    ).toBeVisible();

    const docTitle = await goToGridDoc(page, {
      title: `${randomDoc}-updated`,
    });

    await expect(page.locator('h2').getByText(docTitle)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Update document',
      })
      .click();

    await expect(
      page.getByRole('textbox', { name: 'Document name' }),
    ).toHaveValue(`${randomDoc}-updated`);
  });

  test('it deletes the doc', async ({ page, browserName }) => {
    const [randomDoc] = await createDoc(page, 'doc-delete', browserName, 1);
    await expect(page.locator('h2').getByText(randomDoc)).toBeVisible();

    await page.getByLabel('Open the document options').click();
    await page
      .getByRole('button', {
        name: 'Delete document',
      })
      .click();

    await expect(
      page.locator('h2').getByText(`Deleting the document "${randomDoc}"`),
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: 'Confirm deletion',
      })
      .click();

    await expect(
      page.getByText('The document has been deleted.'),
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Create a new document' }),
    ).toBeVisible();

    const row = page
      .getByLabel('Datagrid of the documents page 1')
      .getByRole('table')
      .getByRole('row')
      .filter({
        hasText: randomDoc,
      });

    expect(await row.count()).toBe(0);
  });

  test('it checks the options available if administrator', async ({ page }) => {
    await mockedDocument(page, {
      abilities: {
        destroy: false, // Means not owner
        versions_destroy: true,
        versions_list: true,
        versions_retrieve: true,
        manage_accesses: true, // Means admin
        update: true,
        partial_update: true,
        retrieve: true,
      },
    });

    await goToGridDoc(page);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();

    await page.getByLabel('Open the document options').click();

    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Update document' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Delete document' }),
    ).toBeHidden();
  });

  test('it checks the options available if editor', async ({ page }) => {
    await mockedDocument(page, {
      abilities: {
        destroy: false, // Means not owner
        versions_destroy: true,
        versions_list: true,
        versions_retrieve: true,
        manage_accesses: false, // Means not admin
        update: true,
        partial_update: true, // Means editor
        retrieve: true,
      },
    });

    await goToGridDoc(page);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Share' })).toBeHidden();

    await page.getByLabel('Open the document options').click();

    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Update document' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Delete document' }),
    ).toBeHidden();
  });

  test('it checks the options available if reader', async ({ page }) => {
    await mockedDocument(page, {
      abilities: {
        destroy: false, // Means not owner
        versions_destroy: false,
        versions_list: true,
        versions_retrieve: true,
        manage_accesses: false, // Means not admin
        update: false,
        partial_update: false, // Means not editor
        retrieve: true,
      },
    });

    await goToGridDoc(page);

    await expect(page.locator('h2').getByText('Mocked document')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Share' })).toBeHidden();

    await page.getByLabel('Open the document options').click();

    await expect(page.getByRole('button', { name: 'Share' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Update document' }),
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Delete document' }),
    ).toBeHidden();
  });
});
