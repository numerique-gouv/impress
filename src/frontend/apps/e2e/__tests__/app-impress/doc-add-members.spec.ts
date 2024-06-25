import { expect, test } from '@playwright/test';

import { createDoc, randomName } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Document add users', () => {
  test('it selects 2 users and 1 invitation', async ({ page, browserName }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/users/?q=user') && response.status() === 200,
    );
    await createDoc(page, 'select-multi-users', browserName, 1);

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Add members' }).click();

    const inputSearch = page.getByLabel(/Find a member to add to the document/);
    await expect(inputSearch).toBeVisible();

    // Select user 1
    await inputSearch.fill('user');

    const response = await responsePromise;
    const users = (await response.json()).results as {
      email: string;
    }[];

    await page.getByRole('option', { name: users[0].email }).click();

    // Select user 2
    await inputSearch.fill('user');
    await page.getByRole('option', { name: users[1].email }).click();

    // Select email
    const email = randomName('test@test.fr', browserName, 1)[0];
    await inputSearch.fill(email);
    await page.getByRole('option', { name: email }).click();

    // Check user 1 tag
    await expect(
      page.getByText(`${users[0].email}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel(`Remove ${users[0].email}`)).toBeVisible();

    // Check user 2 tag
    await expect(
      page.getByText(`${users[1].email}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel(`Remove ${users[1].email}`)).toBeVisible();

    // Check invitation tag
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByLabel(`Remove ${email}`)).toBeVisible();

    // Check roles are displayed
    await expect(page.getByText(/Choose a role/)).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Reader' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Owner' })).toBeVisible();
    await expect(
      page.getByRole('radio', { name: 'Administrator' }),
    ).toBeVisible();
  });

  test('it sends a new invitation and adds a new user', async ({
    page,
    browserName,
  }) => {
    const responsePromiseSearchUser = page.waitForResponse(
      (response) =>
        response.url().includes('/users/?q=user') && response.status() === 200,
    );

    await createDoc(page, 'user-invitation', browserName, 1);

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Add members' }).click();

    const inputSearch = page.getByLabel(/Find a member to add to the document/);

    const email = randomName('test@test.fr', browserName, 1)[0];
    await inputSearch.fill(email);
    await page.getByRole('option', { name: email }).click();

    // Select a new user
    await inputSearch.fill('user');
    const responseSearchUser = await responsePromiseSearchUser;
    const [user] = (await responseSearchUser.json()).results as {
      email: string;
    }[];
    await page.getByRole('option', { name: user.email }).click();

    // Choose a role
    await page.getByRole('radio', { name: 'Administrator' }).click();

    const responsePromiseCreateInvitation = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 201,
    );
    const responsePromiseAddUser = page.waitForResponse(
      (response) =>
        response.url().includes('/accesses/') && response.status() === 201,
    );

    await page.getByRole('button', { name: 'Validate' }).click();

    // Check invitation sent
    await expect(page.getByText(`Invitation sent to ${email}`)).toBeVisible();
    const responseCreateInvitation = await responsePromiseCreateInvitation;
    expect(responseCreateInvitation.ok()).toBeTruthy();

    // Check user added
    await expect(
      page.getByText(`User ${user.email} added to the document.`),
    ).toBeVisible();
    const responseAddUser = await responsePromiseAddUser;
    expect(responseAddUser.ok()).toBeTruthy();
  });

  test('it try to add twice the same user', async ({ page, browserName }) => {
    const responsePromiseSearchUser = page.waitForResponse(
      (response) =>
        response.url().includes('/users/?q=user') && response.status() === 200,
    );

    await createDoc(page, 'user-twice', browserName, 1);

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Add members' }).click();

    const inputSearch = page.getByLabel(/Find a member to add to the document/);
    await inputSearch.fill('user');
    const responseSearchUser = await responsePromiseSearchUser;
    const [user] = (await responseSearchUser.json()).results as {
      email: string;
    }[];
    await page.getByRole('option', { name: user.email }).click();

    // Choose a role
    await page.getByRole('radio', { name: 'Owner' }).click();

    const responsePromiseAddMember = page.waitForResponse(
      (response) =>
        response.url().includes('/accesses/') && response.status() === 201,
    );

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(
      page.getByText(`User ${user.email} added to the document.`),
    ).toBeVisible();
    const responseAddMember = await responsePromiseAddMember;
    expect(responseAddMember.ok()).toBeTruthy();

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Add members' }).click();

    await inputSearch.fill('user');
    await expect(page.getByRole('option', { name: user.email })).toBeHidden();
  });

  test('it try to add twice the same invitation', async ({
    page,
    browserName,
  }) => {
    await createDoc(page, 'invitation-twice', browserName, 1);

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Add members' }).click();

    const inputSearch = page.getByLabel(/Find a member to add to the document/);

    const email = randomName('test@test.fr', browserName, 1)[0];
    await inputSearch.fill(email);
    await page.getByRole('option', { name: email }).click();

    // Choose a role
    await page.getByRole('radio', { name: 'Owner' }).click();

    const responsePromiseCreateInvitation = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 201,
    );

    await page.getByRole('button', { name: 'Validate' }).click();

    // Check invitation sent
    await expect(page.getByText(`Invitation sent to ${email}`)).toBeVisible();
    const responseCreateInvitation = await responsePromiseCreateInvitation;
    expect(responseCreateInvitation.ok()).toBeTruthy();

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Add members' }).click();

    await inputSearch.fill(email);
    await expect(page.getByRole('option', { name: email })).toBeHidden();
  });
});
