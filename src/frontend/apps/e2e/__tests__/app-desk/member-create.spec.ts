import { expect, test } from '@playwright/test';

import { createTeam, keyCloakSignIn, randomName } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Members Create', () => {
  test('it opens the modals to add a member to the team', async ({
    page,
    browserName,
  }) => {
    await createTeam(page, 'member-open-modal', browserName, 1);

    await page.getByLabel('Add members to the team').click();

    await expect(page.getByText('Add a member')).toBeVisible();
    await expect(
      page.getByLabel(/Find a member to add to the team/),
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Validate' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('it selects 2 users and 1 invitation', async ({ page, browserName }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/users/?q=test') && response.status() === 200,
    );
    await createTeam(page, 'member-modal-search-user', browserName, 1);

    await page.getByLabel('Add members to the team').click();

    await expect(page.getByRole('radio', { name: 'Owner' })).toBeHidden();

    const inputSearch = page.getByLabel(/Find a member to add to the team/);

    // Select user 1
    await inputSearch.fill('test');

    const response = await responsePromise;
    const users = (await response.json()).results as {
      name: string;
    }[];

    await page.getByRole('option', { name: users[0].name }).click();

    // Select user 2
    await inputSearch.fill('test1');
    await page.getByRole('option', { name: users[1].name }).click();

    // Select email
    const email = randomName('test@test.fr', browserName, 1)[0];
    await inputSearch.fill(email);
    await page.getByRole('option', { name: email }).click();

    // Check user 1 tag
    await expect(
      page.getByText(`${users[0].name}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel(`Remove ${users[0].name}`)).toBeVisible();

    // Check user 2 tag
    await expect(
      page.getByText(`${users[1].name}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel(`Remove ${users[1].name}`)).toBeVisible();

    // Check invitation tag
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByLabel(`Remove ${email}`)).toBeVisible();

    // Check roles are displayed
    await expect(page.getByText(/Choose a role/)).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Member' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Owner' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Admin' })).toBeVisible();
  });

  test('it sends a new invitation and adds a new member', async ({
    page,
    browserName,
  }) => {
    const responsePromiseSearchUser = page.waitForResponse(
      (response) =>
        response.url().includes('/users/?q=test') && response.status() === 200,
    );

    await createTeam(page, 'member-invitation', browserName, 1);

    await page.getByLabel('Add members to the team').click();

    // Select a new email
    const inputSearch = page.getByLabel(/Find a member to add to the team/);

    const email = randomName('test@test.fr', browserName, 1)[0];
    await inputSearch.fill(email);
    await page.getByRole('option', { name: email }).click();

    // Select a new user
    await inputSearch.fill('test');
    const responseSearchUser = await responsePromiseSearchUser;
    const users = (await responseSearchUser.json()).results as {
      name: string;
    }[];
    await page.getByRole('option', { name: users[0].name }).click();

    // Choose a role
    await page.getByRole('radio', { name: 'Admin' }).click();

    const responsePromiseCreateInvitation = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 201,
    );
    const responsePromiseAddMember = page.waitForResponse(
      (response) =>
        response.url().includes('/accesses/') && response.status() === 201,
    );

    await page.getByRole('button', { name: 'Validate' }).click();

    // Check invitation sent
    await expect(page.getByText(`Invitation sent to ${email}`)).toBeVisible();
    const responseCreateInvitation = await responsePromiseCreateInvitation;
    expect(responseCreateInvitation.ok()).toBeTruthy();

    // Check member added
    await expect(
      page.getByText(`Member ${users[0].name} added to the team`),
    ).toBeVisible();
    const responseAddMember = await responsePromiseAddMember;
    expect(responseAddMember.ok()).toBeTruthy();

    const table = page.getByLabel('List members card').getByRole('table');
    await expect(table.getByText(users[0].name)).toBeVisible();
    await expect(table.getByText('Admin')).toBeVisible();
  });

  test('it try to add twice the same user', async ({ page, browserName }) => {
    const responsePromiseSearchUser = page.waitForResponse(
      (response) =>
        response.url().includes('/users/?q=test') && response.status() === 200,
    );

    await createTeam(page, 'member-twice', browserName, 1);

    await page.getByLabel('Add members to the team').click();

    const inputSearch = page.getByLabel(/Find a member to add to the team/);
    await inputSearch.fill('test');
    const responseSearchUser = await responsePromiseSearchUser;
    const users = (await responseSearchUser.json()).results as {
      name: string;
    }[];
    await page.getByRole('option', { name: users[0].name }).click();

    // Choose a role
    await page.getByRole('radio', { name: 'Owner' }).click();

    const responsePromiseAddMember = page.waitForResponse(
      (response) =>
        response.url().includes('/accesses/') && response.status() === 201,
    );

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(
      page.getByText(`Member ${users[0].name} added to the team`),
    ).toBeVisible();
    const responseAddMember = await responsePromiseAddMember;
    expect(responseAddMember.ok()).toBeTruthy();

    await page.getByLabel('Add members to the team').click();

    await inputSearch.fill('test');
    await expect(
      page.getByRole('option', { name: users[0].name }),
    ).toBeHidden();
  });

  test('it try to add twice the same invitation', async ({
    page,
    browserName,
  }) => {
    await createTeam(page, 'invitation-twice', browserName, 1);

    await page.getByLabel('Add members to the team').click();

    const inputSearch = page.getByLabel(/Find a member to add to the team/);

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

    await page.getByLabel('Add members to the team').click();

    await inputSearch.fill(email);
    await expect(page.getByRole('option', { name: email })).toBeHidden();
  });
});
