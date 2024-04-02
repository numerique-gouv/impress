import { expect, test } from '@playwright/test';

import { createTeam, keyCloakSignIn, randomName } from './common';

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

  test('it updates the team name', async ({ page, browserName }) => {
    await createTeam(page, 'team-update-name', browserName, 1);

    await page.getByLabel(`Open the team options`).click();
    await page.getByRole('button', { name: `Update the team` }).click();

    const teamName = randomName('new-team-update-name', browserName, 1)[0];
    await page.getByText('New name...', { exact: true }).fill(teamName);

    await page
      .getByRole('button', { name: 'Validate the modification' })
      .click();

    await expect(page.getByText('The team has been updated.')).toBeVisible();
    await expect(
      page.getByText(`Add people to the “${teamName}“ group.`),
    ).toBeVisible();
  });
});
