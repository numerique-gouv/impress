import { Page, expect } from '@playwright/test';

export const keyCloakSignIn = async (page: Page, browserName: string) => {
  const login = `user-e2e-${browserName}`;
  const password = `password-e2e-${browserName}`;

  if (await page.getByLabel('Restart login').isVisible()) {
    await page.getByRole('textbox', { name: 'password' }).fill(password);

    await page.click('input[type="submit"]', { force: true });
  } else {
    await page.getByRole('textbox', { name: 'username' }).fill(login);

    await page.getByRole('textbox', { name: 'password' }).fill(password);

    await page.click('input[type="submit"]', { force: true });
  }
};

export const randomName = (name: string, browserName: string, length: number) =>
  Array.from({ length }, (_el, index) => {
    return `${browserName}-${Math.floor(Math.random() * 10000)}-${index}-${name}`;
  });

export const createDoc = async (
  page: Page,
  docName: string,
  browserName: string,
  length: number,
  isPublic: boolean = false,
) => {
  const randomDocs = randomName(docName, browserName, length);

  for (let i = 0; i < randomDocs.length; i++) {
    const header = page.locator('header').first();
    await header.locator('h2').getByText('Docs').click();

    await page
      .getByRole('button', {
        name: 'Create a new document',
      })
      .click();

    await page.getByRole('heading', { name: 'Untitled document' }).click();
    await page.keyboard.type(randomDocs[i]);
    await page.getByText('Created at ').click();

    if (isPublic) {
      await page.getByRole('button', { name: 'Share' }).click();
      await page.getByText('Doc private').click();

      await page.locator('.c__modal__backdrop').click({
        position: { x: 0, y: 0 },
      });

      await expect(
        page
          .getByLabel('It is the card information about the document.')
          .getByText('Public'),
      ).toBeVisible();
    }
  }

  return randomDocs;
};

export const addNewMember = async (
  page: Page,
  index: number,
  role: 'Administrator' | 'Owner' | 'Member' | 'Editor' | 'Reader',
  fillText: string = 'user',
) => {
  const responsePromiseSearchUser = page.waitForResponse(
    (response) =>
      response.url().includes(`/users/?q=${fillText}`) &&
      response.status() === 200,
  );

  const inputSearch = page.getByLabel(/Find a member to add to the document/);

  // Select a new user
  await inputSearch.fill(fillText);

  // Intercept response
  const responseSearchUser = await responsePromiseSearchUser;
  const users = (await responseSearchUser.json()).results as {
    email: string;
  }[];

  // Choose user
  await page.getByRole('option', { name: users[index].email }).click();

  // Choose a role
  await page.getByRole('combobox', { name: /Choose a role/ }).click();
  await page.getByRole('option', { name: role }).click();
  await page.getByRole('button', { name: 'Validate' }).click();

  await expect(
    page.getByText(`User ${users[index].email} added to the document.`),
  ).toBeVisible();

  return users[index].email;
};

interface GoToGridDocOptions {
  nthRow?: number;
  title?: string;
}
export const goToGridDoc = async (
  page: Page,
  { nthRow = 1, title }: GoToGridDocOptions = {},
) => {
  const header = page.locator('header').first();
  await header.locator('h2').getByText('Docs').click();

  const datagrid = page
    .getByLabel('Datagrid of the documents page 1')
    .getByRole('table');

  await expect(datagrid.getByLabel('Loading data')).toBeHidden();

  const rows = datagrid.getByRole('row');
  const row = title
    ? rows.filter({
        hasText: title,
      })
    : rows.nth(nthRow);

  const docTitleCell = row.getByRole('cell').nth(1);

  const docTitle = await docTitleCell.textContent();

  expect(docTitle).toBeDefined();

  await docTitleCell.click();

  return docTitle as string;
};

export const mockedDocument = async (page: Page, json: object) => {
  await page.route('**/documents/**/', async (route) => {
    const request = route.request();
    if (request.method().includes('GET') && !request.url().includes('page=')) {
      await route.fulfill({
        json: {
          id: 'mocked-document-id',
          content: '',
          title: 'Mocked document',
          accesses: [],
          abilities: {
            destroy: false, // Means not owner
            link_configuration: false,
            versions_destroy: false,
            versions_list: true,
            versions_retrieve: true,
            manage_accesses: false, // Means not admin
            update: false,
            partial_update: false, // Means not editor
            retrieve: true,
          },
          link_reach: 'restricted',
          created_at: '2021-09-01T09:00:00Z',
          ...json,
        },
      });
    } else {
      await route.continue();
    }
  });
};
