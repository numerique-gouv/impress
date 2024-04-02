import { expect, test } from '@playwright/test';

import { createTeam, keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Member Grid', () => {
  test('checks the owner member is displayed correctly', async ({
    page,
    browserName,
  }) => {
    await createTeam(page, 'team-owner', browserName, 1);

    const table = page.getByLabel('List members card').getByRole('table');

    const thead = table.locator('thead');
    await expect(thead.getByText(/Names/i)).toBeVisible();
    await expect(thead.getByText(/Emails/i)).toBeVisible();
    await expect(thead.getByText(/Roles/i)).toBeVisible();

    const cells = table.getByRole('row').nth(1).getByRole('cell');
    await expect(cells.nth(0).getByLabel('Member icon')).toBeVisible();
    await expect(cells.nth(1)).toHaveText(
      new RegExp(`E2E ${browserName}`, 'i'),
    );
    await expect(cells.nth(2)).toHaveText(`user@${browserName}.e2e`);
    await expect(cells.nth(3)).toHaveText(/Owner/i);
  });

  test('try to update the owner role but cannot because it is the last owner', async ({
    page,
    browserName,
  }) => {
    await createTeam(page, 'team-owner-role', browserName, 1);

    const table = page.getByLabel('List members card').getByRole('table');

    const cells = table.getByRole('row').nth(1).getByRole('cell');
    await expect(cells.nth(1)).toHaveText(
      new RegExp(`E2E ${browserName}`, 'i'),
    );
    await cells.nth(4).getByLabel('Member options').click();
    await page.getByText('Update the role').click();

    await expect(
      page.getByText('You are the last owner, you cannot change your role.'),
    ).toBeVisible();

    const radioGroup = page.getByLabel('Radio buttons to update the roles');

    const radios = await radioGroup.getByRole('radio').all();
    for (const radio of radios) {
      await expect(radio).toBeDisabled();
    }

    await expect(
      page.getByRole('button', {
        name: 'Validate',
      }),
    ).toBeDisabled();
  });
});
