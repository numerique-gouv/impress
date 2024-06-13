import { Page, expect } from '@playwright/test';

export const keyCloakSignIn = async (page: Page, browserName: string) => {
  const title = await page.locator('h1').first().textContent({
    timeout: 5000,
  });

  const login = `user-e2e-${browserName}`;
  const password = `password-e2e-${browserName}`;

  if (await page.getByLabel('Restart login').isVisible()) {
    await page.getByRole('textbox', { name: 'password' }).fill(password);

    await page.click('input[type="submit"]', { force: true });
  } else if (title?.includes('Sign in to your account')) {
    await page.getByRole('textbox', { name: 'username' }).fill(login);

    await page.getByRole('textbox', { name: 'password' }).fill(password);

    await page.click('input[type="submit"]', { force: true });
  }
};

export const randomName = (name: string, browserName: string, length: number) =>
  Array.from({ length }, (_el, index) => {
    return `${browserName}-${Math.floor(Math.random() * 10000)}-${index}-${name}`;
  });

export const createPad = async (
  page: Page,
  padName: string,
  browserName: string,
  length: number,
  isPublic: boolean = false,
) => {
  const panel = page.getByLabel('Documents panel').first();
  const buttonCreate = page.getByRole('button', {
    name: 'Create the document',
  });

  const randomPads = randomName(padName, browserName, length);

  for (let i = 0; i < randomPads.length; i++) {
    await panel.getByRole('button', { name: 'Add a document' }).click();
    await page.getByText('Document name').fill(randomPads[i]);

    if (isPublic) {
      await page.getByText('Is it public ?').click();
    }

    await expect(buttonCreate).toBeEnabled();
    await buttonCreate.click();
    await expect(panel.locator('li').getByText(randomPads[i])).toBeVisible();
  }

  return randomPads;
};

export const createTemplate = async (
  page: Page,
  templateName: string,
  browserName: string,
  length: number,
) => {
  const menu = page.locator('menu').first();
  await menu.getByLabel(`Template button`).click();

  const panel = page.getByLabel('Templates panel').first();
  const buttonCreate = page.getByRole('button', {
    name: 'Create the template',
  });

  const randomTemplates = randomName(templateName, browserName, length);

  for (let i = 0; i < randomTemplates.length; i++) {
    await panel.getByRole('button', { name: 'Add a template' }).click();
    await page.getByText('Template name').fill(randomTemplates[i]);
    await expect(buttonCreate).toBeEnabled();
    await buttonCreate.click();
    await expect(
      panel.locator('li').getByText(randomTemplates[i]),
    ).toBeVisible();
  }

  return randomTemplates;
};

export const addNewMember = async (
  page: Page,
  index: number,
  role: 'Admin' | 'Owner' | 'Member',
  fillText: string = 'user',
) => {
  const responsePromiseSearchUser = page.waitForResponse(
    (response) =>
      response.url().includes(`/users/?q=${fillText}`) &&
      response.status() === 200,
  );

  await page.getByLabel('Open the document options').click();
  await page.getByRole('button', { name: 'Add members' }).click();

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
  await page.getByRole('radio', { name: role }).click();

  await page.getByRole('button', { name: 'Validate' }).click();

  await expect(
    page.getByText(`User ${users[index].email} added to the document.`),
  ).toBeVisible();

  return users[index].email;
};
