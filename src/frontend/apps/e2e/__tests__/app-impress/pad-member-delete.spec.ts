import { expect, test } from '@playwright/test';

import { addNewMember, createPad } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Members Delete', () => {
  test('it cannot delete himself when it is the last owner', async ({
    page,
    browserName,
  }) => {
    await createPad(page, 'member-delete-1', browserName, 1);

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Manage members' }).click();

    const table = page.getByLabel('List members card').getByRole('table');

    const cells = table.getByRole('row').nth(1).getByRole('cell');
    await expect(cells.nth(0)).toHaveText(
      new RegExp(`user@${browserName}.e2e`, 'i'),
    );
    await cells.nth(2).getByLabel('Member options').click();
    await page.getByLabel('Open the modal to delete this member').click();

    await expect(
      page.getByText(
        'You are the last owner, you cannot be removed from your document.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Validate' })).toBeDisabled();
  });

  test('it deletes himself when it is not the last owner', async ({
    page,
    browserName,
  }) => {
    await createPad(page, 'member-delete-2', browserName, 1);

    await addNewMember(page, 0, 'Owner');

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Manage members' }).click();

    const table = page.getByLabel('List members card').getByRole('table');

    // find row where regexp match the name
    const cells = table
      .getByRole('row')
      .filter({ hasText: new RegExp(`user@${browserName}.e2e`, 'i') })
      .getByRole('cell');
    await cells.nth(2).getByLabel('Member options').click();
    await page.getByLabel('Open the modal to delete this member').click();

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(
      page.getByText(`The member has been removed from the document`),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Create a new document` }),
    ).toBeVisible();
  });

  test('it cannot delete owner member', async ({ page, browserName }) => {
    await createPad(page, 'member-delete-3', browserName, 1);

    const username = await addNewMember(page, 0, 'Owner');

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Manage members' }).click();

    const table = page.getByLabel('List members card').getByRole('table');

    // find row where regexp match the name
    const cells = table
      .getByRole('row')
      .filter({ hasText: username })
      .getByRole('cell');
    await cells.getByLabel('Member options').click();
    await page.getByLabel('Open the modal to delete this member').click();

    await expect(
      page.getByText(`You cannot remove other owner.`),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Validate' })).toBeDisabled();
  });

  test('it deletes admin member', async ({ page, browserName }) => {
    await createPad(page, 'member-delete-4', browserName, 1);

    const username = await addNewMember(page, 0, 'Admin');

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Manage members' }).click();

    const table = page.getByLabel('List members card').getByRole('table');

    // find row where regexp match the name
    const cells = table
      .getByRole('row')
      .filter({ hasText: username })
      .getByRole('cell');
    await cells.getByLabel('Member options').click();
    await page.getByLabel('Open the modal to delete this member').click();

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(
      page.getByText(`The member has been removed from the document`),
    ).toBeVisible();
    await expect(table.getByText(username)).toBeHidden();
  });

  test('it cannot delete owner member when admin', async ({
    page,
    browserName,
  }) => {
    await createPad(page, 'member-delete-5', browserName, 1);

    const username = await addNewMember(page, 0, 'Owner');

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Manage members' }).click();

    const table = page.getByLabel('List members card').getByRole('table');

    // find row where regexp match the name
    const myCells = table
      .getByRole('row')
      .filter({ hasText: new RegExp(`user@${browserName}.e2e`, 'i') })
      .getByRole('cell');
    await myCells.getByLabel('Member options').click();

    // Change role to Admin
    await page.getByText('Update role').click();
    const radioGroup = page.getByLabel('Radio buttons to update the roles');
    await radioGroup.getByRole('radio', { name: 'Administrator' }).click();
    await page.getByRole('button', { name: 'Validate' }).click();

    const cells = table
      .getByRole('row')
      .filter({ hasText: username })
      .getByRole('cell');
    await expect(cells.getByLabel('Member options')).toBeHidden();
  });

  test('it deletes admin member when admin', async ({ page, browserName }) => {
    await createPad(page, 'member-delete-6', browserName, 1);

    // To not be the only owner
    await addNewMember(page, 0, 'Owner');

    const username = await addNewMember(page, 1, 'Admin');

    await expect(
      page.getByText(`User added to the document.`).last(),
    ).toBeHidden({
      timeout: 5000,
    });

    await page.getByLabel('Open the document options').click();
    await page.getByRole('button', { name: 'Manage members' }).click();

    const table = page.getByLabel('List members card').getByRole('table');

    // find row where regexp match the name
    const myCells = table
      .getByRole('row')
      .filter({ hasText: new RegExp(`user@${browserName}.e2e`, 'i') })
      .getByRole('cell');
    await myCells.getByLabel('Member options').click();

    // Change role to Admin
    await page.getByText('Update role').click();
    const radioGroup = page.getByLabel('Radio buttons to update the roles');
    await radioGroup.getByRole('radio', { name: 'Administrator' }).click();
    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByText(`The role has been updated`)).toBeVisible();
    await expect(page.getByText(`The role has been updated`)).toBeHidden({
      timeout: 5000,
    });

    const cells = table
      .getByRole('row')
      .filter({ hasText: new RegExp(username, 'i') })
      .getByRole('cell');
    await cells.nth(2).getByLabel('Member options').click();
    await page.getByLabel('Open the modal to delete this member').click();

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(
      page.getByText(`The member has been removed from the document`),
    ).toBeVisible();
    await expect(table.getByText(username)).toBeHidden();
  });
});
