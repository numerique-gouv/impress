import { expect, test } from '@playwright/test';

import { createTeam, keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Team', () => {
  test('checks all the top box elements are visible', async ({
    page,
    browserName,
  }) => {
    const teamName = (
      await createTeam(page, 'team-top-box', browserName, 1)
    ).shift();

    await expect(page.getByLabel('icon group')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: `Members of “${teamName}“`,
        level: 3,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(`Add people to the “${teamName}“ group.`),
    ).toBeVisible();

    await expect(page.getByText(`1 member`)).toBeVisible();

    const today = new Date(Date.now());
    const todayFormated = today.toLocaleDateString('en', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    await expect(page.getByText(`Created at ${todayFormated}`)).toBeVisible();
    await expect(
      page.getByText(`Last update at ${todayFormated}`),
    ).toBeVisible();
  });

  test('checks the admin members is displayed correctly', async ({
    page,
    browserName,
  }) => {
    await createTeam(page, 'team-admin', browserName, 1);

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
    await expect(cells.nth(3)).toHaveText('owner');
  });
});