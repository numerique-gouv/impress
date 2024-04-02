import { expect, test } from '@playwright/test';

import { addNewMember, createTeam, keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Teams Delete', () => {
  test('it deletes the team when we are owner', async ({
    page,
    browserName,
  }) => {
    await createTeam(page, 'team-update-name-1', browserName, 1);

    await page.getByLabel(`Open the team options`).click();
    await page.getByRole('button', { name: `Delete the team` }).click();
    await page.getByRole('button', { name: `Confirm deletion` }).click();
    await expect(page.getByText(`The team has been removed.`)).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Create a new team` }),
    ).toBeVisible();
  });

  test('it cannot delete the team when we are admin', async ({
    page,
    browserName,
  }) => {
    await createTeam(page, 'team-update-name-2', browserName, 1);

    await addNewMember(page, 0, 'Owner');

    // Change role to Admin
    const table = page.getByLabel('List members card').getByRole('table');
    const myCells = table
      .getByRole('row')
      .filter({ hasText: new RegExp(`E2E ${browserName}`, 'i') })
      .getByRole('cell');
    await myCells.nth(4).getByLabel('Member options').click();

    await page.getByText('Update the role').click();
    const radioGroup = page.getByLabel('Radio buttons to update the roles');
    await radioGroup.getByRole('radio', { name: 'Admin' }).click();
    await page.getByRole('button', { name: 'Validate' }).click();

    // Delete the team button should be hidden
    await page.getByLabel(`Open the team options`).click();
    await expect(
      page.getByRole('button', { name: `Delete the team` }),
    ).toBeHidden();
  });

  test('it cannot delete the team when we are member', async ({
    page,
    browserName,
  }) => {
    await createTeam(page, 'team-update-name-3', browserName, 1);

    await addNewMember(page, 0, 'Owner');

    // Change role to Admin
    const table = page.getByLabel('List members card').getByRole('table');
    const myCells = table
      .getByRole('row')
      .filter({ hasText: new RegExp(`E2E ${browserName}`, 'i') })
      .getByRole('cell');
    await myCells.nth(4).getByLabel('Member options').click();

    await page.getByText('Update the role').click();
    const radioGroup = page.getByLabel('Radio buttons to update the roles');
    await radioGroup.getByRole('radio', { name: 'Member' }).click();
    await page.getByRole('button', { name: 'Validate' }).click();

    // Option button should be hidden
    await expect(page.getByLabel(`Open the team options`)).toBeHidden();
  });
});
