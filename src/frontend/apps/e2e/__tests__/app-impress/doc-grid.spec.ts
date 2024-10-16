import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Documents Grid', () => {
  test('checks all the elements are visible', async ({ page }) => {
    await expect(page.locator('h2').getByText('Documents')).toBeVisible();

    const datagrid = page
      .getByLabel('Datagrid of the documents page 1')
      .getByRole('table');

    const thead = datagrid.locator('thead');
    await expect(thead.getByText(/Document name/i)).toBeVisible();
    await expect(thead.getByText(/Created at/i)).toBeVisible();
    await expect(thead.getByText(/Updated at/i)).toBeVisible();
    await expect(thead.getByText(/Your role/i)).toBeVisible();
    await expect(thead.getByText(/Members/i)).toBeVisible();

    const row1 = datagrid.getByRole('row').nth(1).getByRole('cell');
    const docName = await row1.nth(1).textContent();
    expect(docName).toBeDefined();

    const docCreatedAt = await row1.nth(2).textContent();
    expect(docCreatedAt).toBeDefined();

    const docUpdatedAt = await row1.nth(3).textContent();
    expect(docUpdatedAt).toBeDefined();

    const docRole = await row1.nth(4).textContent();
    expect(
      docRole &&
        ['Administrator', 'Owner', 'Reader', 'Editor'].includes(docRole),
    ).toBeTruthy();

    const docUserNumber = await row1.nth(5).textContent();
    expect(docUserNumber).toBeDefined();

    // Open the document
    await row1.nth(1).click();

    await expect(page.locator('h2').getByText(docName!)).toBeVisible();
  });

  [
    {
      nameColumn: 'Document name',
      ordering: 'title',
      cellNumber: 1,
      orderDefault: '',
      orderDesc: '&ordering=-title',
      orderAsc: '&ordering=title',
      defaultColumn: false,
    },
    {
      nameColumn: 'Created at',
      ordering: 'created_at',
      cellNumber: 2,
      orderDefault: '',
      orderDesc: '&ordering=-created_at',
      orderAsc: '&ordering=created_at',
      defaultColumn: false,
    },
    {
      nameColumn: 'Updated at',
      ordering: 'updated_at',
      cellNumber: 3,
      orderDefault: '&ordering=-updated_at',
      orderDesc: '&ordering=updated_at',
      orderAsc: '',
      defaultColumn: true,
    },
  ].forEach(
    ({
      nameColumn,
      ordering,
      cellNumber,
      orderDefault,
      orderDesc,
      orderAsc,
      defaultColumn,
    }) => {
      test(`checks datagrid ordering ${ordering}`, async ({ page }) => {
        const responsePromise = page.waitForResponse(
          (response) =>
            response.url().includes(`/documents/?page=1${orderDefault}`) &&
            response.status() === 200,
        );

        const responsePromiseOrderingDesc = page.waitForResponse(
          (response) =>
            response.url().includes(`/documents/?page=1${orderDesc}`) &&
            response.status() === 200,
        );

        const responsePromiseOrderingAsc = page.waitForResponse(
          (response) =>
            response.url().includes(`/documents/?page=1${orderAsc}`) &&
            response.status() === 200,
        );

        // Checks the initial state
        const datagrid = page.getByLabel('Datagrid of the documents page 1');
        const datagridTable = datagrid.getByRole('table');
        const thead = datagridTable.locator('thead');

        const response = await responsePromise;
        expect(response.ok()).toBeTruthy();

        const docNameRow1 = datagridTable
          .getByRole('row')
          .nth(1)
          .getByRole('cell')
          .nth(cellNumber);
        const docNameRow2 = datagridTable
          .getByRole('row')
          .nth(2)
          .getByRole('cell')
          .nth(cellNumber);

        await expect(datagrid.getByLabel('Loading data')).toBeHidden({
          timeout: 10000,
        });

        // Initial state
        await expect(docNameRow1).toHaveText(/.*/);
        await expect(docNameRow2).toHaveText(/.*/);
        const initialDocNameRow1 = await docNameRow1.textContent();
        const initialDocNameRow2 = await docNameRow2.textContent();

        expect(initialDocNameRow1).toBeDefined();
        expect(initialDocNameRow2).toBeDefined();

        // Ordering ASC
        await thead.getByText(nameColumn).click();

        const responseOrderingAsc = await responsePromiseOrderingAsc;
        expect(responseOrderingAsc.ok()).toBeTruthy();

        await expect(datagrid.getByLabel('Loading data')).toBeHidden({
          timeout: 10000,
        });

        await expect(docNameRow1).toHaveText(/.*/);
        await expect(docNameRow2).toHaveText(/.*/);
        const textDocNameRow1Asc = await docNameRow1.textContent();
        const textDocNameRow2Asc = await docNameRow2.textContent();

        const compare = (comp1: string, comp2: string) => {
          const comparisonResult = comp1.localeCompare(comp2, 'en', {
            caseFirst: 'false',
            ignorePunctuation: true,
          });

          // eslint-disable-next-line playwright/no-conditional-in-test
          return defaultColumn ? comparisonResult >= 0 : comparisonResult <= 0;
        };

        expect(
          textDocNameRow1Asc &&
            textDocNameRow2Asc &&
            compare(textDocNameRow1Asc, textDocNameRow2Asc),
        ).toBeTruthy();

        // Ordering Desc
        await thead.getByText(nameColumn).click();

        const responseOrderingDesc = await responsePromiseOrderingDesc;
        expect(responseOrderingDesc.ok()).toBeTruthy();

        await expect(datagrid.getByLabel('Loading data')).toBeHidden({
          timeout: 10000,
        });

        await expect(docNameRow1).toHaveText(/.*/);
        await expect(docNameRow2).toHaveText(/.*/);
        const textDocNameRow1Desc = await docNameRow1.textContent();
        const textDocNameRow2Desc = await docNameRow2.textContent();

        expect(
          textDocNameRow1Desc &&
            textDocNameRow2Desc &&
            compare(textDocNameRow2Desc, textDocNameRow1Desc),
        ).toBeTruthy();
      });
    },
  );

  test('checks the pagination', async ({ page }) => {
    const responsePromisePage1 = page.waitForResponse(
      (response) =>
        response.url().includes(`/documents/?page=1`) &&
        response.status() === 200,
    );

    const responsePromisePage2 = page.waitForResponse(
      (response) =>
        response.url().includes(`/documents/?page=2`) &&
        response.status() === 200,
    );

    const datagridPage1 = page
      .getByLabel('Datagrid of the documents page 1')
      .getByRole('table');

    const responsePage1 = await responsePromisePage1;
    expect(responsePage1.ok()).toBeTruthy();

    await expect(
      datagridPage1.getByRole('row').nth(1).getByRole('cell').nth(1),
    ).toHaveText(/.*/);

    await page.getByLabel('Go to page 2').click();

    const datagridPage2 = page
      .getByLabel('Datagrid of the documents page 2')
      .getByRole('table');

    const responsePage2 = await responsePromisePage2;
    expect(responsePage2.ok()).toBeTruthy();

    await expect(
      datagridPage2.getByRole('row').nth(1).getByRole('cell').nth(1),
    ).toHaveText(/.*/);
  });

  test('it deletes the document', async ({ page }) => {
    const datagrid = page
      .getByLabel('Datagrid of the documents page 1')
      .getByRole('table');

    const docRow = datagrid.getByRole('row').nth(1).getByRole('cell');

    const docName = await docRow.nth(1).textContent();

    await docRow
      .getByRole('button', {
        name: 'Delete the document',
      })
      .click();

    await expect(
      page.locator('h2').getByText(`Deleting the document "${docName}"`),
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: 'Confirm deletion',
      })
      .click();

    await expect(
      page.getByText('The document has been deleted.'),
    ).toBeVisible();

    await expect(datagrid.getByText(docName!)).toBeHidden();
  });
});

test.describe('Documents Grid mobile', () => {
  test.use({ viewport: { width: 500, height: 1200 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('it checks the grid when mobile', async ({ page }) => {
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
                  manage_accesses: true,
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

    await page.goto('/');

    const datagrid = page.getByLabel('Datagrid of the documents page 1');
    const tableDatagrid = datagrid.getByRole('table');

    await expect(datagrid.getByLabel('Loading data')).toBeHidden({
      timeout: 10000,
    });

    const rows = tableDatagrid.getByRole('row');
    const row = rows.filter({
      hasText: 'My mocked document',
    });

    await expect(row.getByRole('cell').nth(0)).toHaveText('My mocked document');
    await expect(row.getByRole('cell').nth(1)).toHaveText('Public');
  });
});
