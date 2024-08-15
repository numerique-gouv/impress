import { expect, test } from '@playwright/test';

import { createDoc, randomName } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Document create member', () => {
  test('it selects 2 users and 1 invitation', async ({ page, browserName }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/users/?q=user') && response.status() === 200,
    );
    await createDoc(page, 'select-multi-users', browserName, 1);

    await page.getByRole('button', { name: 'Share' }).click();

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
    await page.getByRole('combobox', { name: /Choose a role/ }).click();

    await expect(page.getByRole('option', { name: 'Reader' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Editor' })).toBeVisible();
    await expect(
      page.getByRole('option', { name: 'Administrator' }),
    ).toBeVisible();
    await expect(page.getByRole('option', { name: 'Owner' })).toBeVisible();
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

    await page.getByRole('button', { name: 'Share' }).click();

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
    await page.getByRole('combobox', { name: /Choose a role/ }).click();
    await page.getByRole('option', { name: 'Administrator' }).click();

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
    expect(
      responseCreateInvitation.request().headers()['content-language'],
    ).toBe('en-us');

    // Check user added
    await expect(
      page.getByText(`User ${user.email} added to the document.`),
    ).toBeVisible();
    const responseAddUser = await responsePromiseAddUser;
    expect(responseAddUser.ok()).toBeTruthy();
    expect(responseAddUser.request().headers()['content-language']).toBe(
      'en-us',
    );
  });

  test('it try to add twice the same user', async ({ page, browserName }) => {
    const responsePromiseSearchUser = page.waitForResponse(
      (response) =>
        response.url().includes('/users/?q=user') && response.status() === 200,
    );

    await createDoc(page, 'user-twice', browserName, 1);

    await page.getByRole('button', { name: 'Share' }).click();

    const inputSearch = page.getByLabel(/Find a member to add to the document/);
    await inputSearch.fill('user');
    const responseSearchUser = await responsePromiseSearchUser;
    const [user] = (await responseSearchUser.json()).results as {
      email: string;
    }[];
    await page.getByRole('option', { name: user.email }).click();

    // Choose a role
    await page.getByRole('combobox', { name: /Choose a role/ }).click();
    await page.getByRole('option', { name: 'Owner' }).click();

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

    await inputSearch.fill('user');
    await expect(page.getByText('Loading...')).toBeHidden();
    await expect(page.getByRole('option', { name: user.email })).toBeHidden();
  });

  test('it try to add twice the same invitation', async ({
    page,
    browserName,
  }) => {
    await createDoc(page, 'invitation-twice', browserName, 1);

    await page.getByRole('button', { name: 'Share' }).click();

    const inputSearch = page.getByLabel(/Find a member to add to the document/);

    const [email] = randomName('test@test.fr', browserName, 1);
    await inputSearch.fill(email);
    await page.getByRole('option', { name: email }).click();

    // Choose a role
    await page.getByRole('combobox', { name: /Choose a role/ }).click();
    await page.getByRole('option', { name: 'Owner' }).click();

    const responsePromiseCreateInvitation = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 201,
    );

    await page.getByRole('button', { name: 'Validate' }).click();

    // Check invitation sent
    await expect(page.getByText(`Invitation sent to ${email}`)).toBeVisible();
    const responseCreateInvitation = await responsePromiseCreateInvitation;
    expect(responseCreateInvitation.ok()).toBeTruthy();

    await inputSearch.fill(email);
    await page.getByRole('option', { name: email }).click();
    // Choose a role
    await page.getByRole('combobox', { name: /Choose a role/ }).click();
    await page.getByRole('option', { name: 'Owner' }).click();

    const responsePromiseCreateInvitationFail = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 400,
    );

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(
      page.getByText(`"${email}" is already invited to the document.`),
    ).toBeVisible();
    const responseCreateInvitationFail =
      await responsePromiseCreateInvitationFail;
    expect(responseCreateInvitationFail.ok()).toBeFalsy();
  });

  test('The invitation endpoint get the language of the website', async ({
    page,
    browserName,
  }) => {
    await createDoc(page, 'user-invitation', browserName, 1);

    const header = page.locator('header').first();
    await header.getByRole('combobox').getByText('EN').click();
    await header.getByRole('option', { name: 'FR' }).click();

    await page.getByRole('button', { name: 'Partager' }).click();

    const inputSearch = page.getByLabel(
      /Trouver un membre à ajouter au document/,
    );

    const email = randomName('test@test.fr', browserName, 1)[0];
    await inputSearch.fill(email);
    await page.getByRole('option', { name: email }).click();

    // Choose a role
    await page.getByRole('combobox', { name: /Choisissez un rôle/ }).click();
    await page.getByRole('option', { name: 'Administrateur' }).click();

    const responsePromiseCreateInvitation = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 201,
    );

    await page.getByRole('button', { name: 'Valider' }).click();

    // Check invitation sent
    await expect(page.getByText(`Invitation envoyée à ${email}`)).toBeVisible();
    const responseCreateInvitation = await responsePromiseCreateInvitation;
    expect(responseCreateInvitation.ok()).toBeTruthy();
    expect(
      responseCreateInvitation.request().headers()['content-language'],
    ).toBe('fr-fr');
  });
});
