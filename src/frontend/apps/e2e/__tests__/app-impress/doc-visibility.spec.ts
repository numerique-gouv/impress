import { expect, test } from '@playwright/test';

import { createDoc, keyCloakSignIn } from './common';

const browsersName = ['chromium', 'webkit', 'firefox'];

test.describe('Doc Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('It checks the copy link button', async ({ page, browserName }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      browserName === 'webkit',
      'navigator.clipboard is not working with webkit and playwright',
    );

    await createDoc(page, 'My button copy doc', browserName, 1);

    await page.getByRole('button', { name: 'Share' }).click();
    await page.getByRole('button', { name: 'Copy link' }).click();

    await expect(page.getByText('Link Copied !')).toBeVisible();

    const handle = await page.evaluateHandle(() =>
      navigator.clipboard.readText(),
    );
    const clipboardContent = await handle.jsonValue();

    expect(clipboardContent).toMatch(page.url());
  });

  test('It checks the link role options', async ({ page, browserName }) => {
    await createDoc(page, 'Doc role options', browserName, 1);

    await page.getByRole('button', { name: 'Share' }).click();

    const selectVisibility = page.getByRole('combobox', {
      name: 'Visibility',
    });

    await expect(selectVisibility.getByText('Authenticated')).toBeVisible();

    await expect(page.getByLabel('Read only')).toBeVisible();
    await expect(page.getByLabel('Can read and edit')).toBeVisible();

    await selectVisibility.click();
    await page
      .getByRole('option', {
        name: 'Restricted',
      })
      .click();

    await expect(page.getByLabel('Read only')).toBeHidden();
    await expect(page.getByLabel('Can read and edit')).toBeHidden();

    await selectVisibility.click();

    await page
      .getByRole('option', {
        name: 'Public',
      })
      .click();

    await expect(page.getByLabel('Read only')).toBeVisible();
    await expect(page.getByLabel('Can read and edit')).toBeVisible();
  });
});

test.describe('Doc Visibility: Restricted', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('A doc is not accessible when not authentified.', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(
      page,
      'Restricted no auth',
      browserName,
      1,
    );

    await expect(page.getByRole('heading', { name: docTitle })).toBeVisible();

    await page.getByRole('button', { name: 'Share' }).click();
    await page
      .getByRole('combobox', {
        name: 'Visibility',
      })
      .click();
    await page
      .getByRole('option', {
        name: 'Restricted',
      })
      .click();

    await expect(
      page.getByText('The document visibility has been updated.'),
    ).toBeVisible();

    await page.locator('.c__modal__backdrop').click({
      position: { x: 0, y: 0 },
    });

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    await page.goto(urlDoc);

    await expect(page.getByRole('textbox', { name: 'password' })).toBeVisible();
  });

  test('A doc is not accessible when authentified but not member.', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(page, 'Restricted auth', browserName, 1);

    await expect(page.getByRole('heading', { name: docTitle })).toBeVisible();

    await page.getByRole('button', { name: 'Share' }).click();
    await page
      .getByRole('combobox', {
        name: 'Visibility',
      })
      .click();
    await page
      .getByRole('option', {
        name: 'Restricted',
      })
      .click();

    await expect(
      page.getByText('The document visibility has been updated.'),
    ).toBeVisible();

    await page.locator('.c__modal__backdrop').click({
      position: { x: 0, y: 0 },
    });

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    const otherBrowser = browsersName.find((b) => b !== browserName);

    await keyCloakSignIn(page, otherBrowser!);

    await page.goto(urlDoc);

    await expect(
      page.getByText('You do not have permission to perform this action.'),
    ).toBeVisible();
  });

  test('A doc is accessible when member.', async ({ page, browserName }) => {
    test.slow();
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(page, 'Restricted auth', browserName, 1);

    await expect(page.getByRole('heading', { name: docTitle })).toBeVisible();

    await page.getByRole('button', { name: 'Share' }).click();
    await page
      .getByRole('combobox', {
        name: 'Visibility',
      })
      .click();
    await page
      .getByRole('option', {
        name: 'Restricted',
      })
      .click();

    await expect(
      page.getByText('The document visibility has been updated.'),
    ).toBeVisible();

    const inputSearch = page.getByLabel(/Find a member to add to the document/);

    const otherBrowser = browsersName.find((b) => b !== browserName);
    const username = `user@${otherBrowser}.e2e`;
    await inputSearch.fill(username);
    await page.getByRole('option', { name: username }).click();

    // Choose a role
    await page.getByRole('combobox', { name: /Choose a role/ }).click();
    await page.getByRole('option', { name: 'Administrator' }).click();

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(
      page.getByText(`User ${username} added to the document.`),
    ).toBeVisible();

    await page.locator('.c__modal__backdrop').click({
      position: { x: 0, y: 0 },
    });

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    await keyCloakSignIn(page, otherBrowser!);

    await page.goto(urlDoc);

    await expect(page.locator('h2').getByText(docTitle)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  });
});

test.describe('Doc Visibility: Public', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('It checks a public doc in read only mode', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(
      page,
      'Public read only',
      browserName,
      1,
    );

    await expect(page.getByRole('heading', { name: docTitle })).toBeVisible();

    await page.getByRole('button', { name: 'Share' }).click();
    await page
      .getByRole('combobox', {
        name: 'Visibility',
      })
      .click();

    await page
      .getByRole('option', {
        name: 'Public',
      })
      .click();

    await expect(
      page.getByText('The document visibility has been updated.'),
    ).toBeVisible();

    await page.getByLabel('Read only').click();

    await expect(
      page.getByText('The document visibility has been updated.').first(),
    ).toBeVisible();

    await page.locator('.c__modal__backdrop').click({
      position: { x: 0, y: 0 },
    });

    await expect(
      page
        .getByLabel('It is the card information about the document.')
        .getByText('Public', { exact: true }),
    ).toBeVisible();

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    await page.goto(urlDoc);

    await expect(page.locator('h2').getByText(docTitle)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share' })).toBeHidden();
    await expect(
      page.getByText('Read only, you cannot edit this document'),
    ).toBeVisible();
  });

  test('It checks a public doc in editable mode', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(page, 'Public editable', browserName, 1);

    await expect(page.getByRole('heading', { name: docTitle })).toBeVisible();

    await page.getByRole('button', { name: 'Share' }).click();
    await page
      .getByRole('combobox', {
        name: 'Visibility',
      })
      .click();

    await page
      .getByRole('option', {
        name: 'Public',
      })
      .click();

    await expect(
      page.getByText('The document visibility has been updated.'),
    ).toBeVisible();

    await page.getByLabel('Can read and edit').click();

    await expect(
      page.getByText('The document visibility has been updated.').first(),
    ).toBeVisible();

    await page.locator('.c__modal__backdrop').click({
      position: { x: 0, y: 0 },
    });

    await expect(
      page
        .getByLabel('It is the card information about the document.')
        .getByText('Public', { exact: true }),
    ).toBeVisible();

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    await page.goto(urlDoc);

    await expect(page.locator('h2').getByText(docTitle)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share' })).toBeHidden();
    await expect(
      page.getByText('Read only, you cannot edit this document'),
    ).toBeHidden();
  });
});

test.describe('Doc Visibility: Authenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('A doc is not accessible when unauthentified.', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(
      page,
      'Authenticated unauthentified',
      browserName,
      1,
    );

    await expect(page.getByRole('heading', { name: docTitle })).toBeVisible();

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    await page.goto(urlDoc);

    await expect(page.locator('h2').getByText(docTitle)).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'password' })).toBeVisible();
  });

  test('It checks a authenticated doc in read only mode', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(
      page,
      'Authenticated read only',
      browserName,
      1,
    );

    await expect(page.getByRole('heading', { name: docTitle })).toBeVisible();

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    const otherBrowser = browsersName.find((b) => b !== browserName);
    await keyCloakSignIn(page, otherBrowser!);

    await page.goto(urlDoc);

    await expect(page.locator('h2').getByText(docTitle)).toBeVisible();
    await page.getByRole('button', { name: 'Share' }).click();
    await expect(
      page.getByText('Read only, you cannot edit this document'),
    ).toBeVisible();

    const shareModal = page.getByLabel('Share modal');

    await expect(
      shareModal.getByRole('combobox', {
        name: 'Visibility',
      }),
    ).toHaveAttribute('disabled');
    await expect(shareModal.getByText('Search by email')).toBeHidden();
    await expect(shareModal.getByLabel('List members card')).toBeHidden();
  });

  test('It checks a authenticated doc in editable mode', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(
      page,
      'Authenticated editable',
      browserName,
      1,
    );

    await expect(page.getByRole('heading', { name: docTitle })).toBeVisible();

    const urlDoc = page.url();

    await page.getByRole('button', { name: 'Share' }).click();

    await page.getByLabel('Can read and edit').click();

    await expect(
      page.getByText('The document visibility has been updated.').first(),
    ).toBeVisible();

    await page.locator('.c__modal__backdrop').click({
      position: { x: 0, y: 0 },
    });

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    const otherBrowser = browsersName.find((b) => b !== browserName);
    await keyCloakSignIn(page, otherBrowser!);

    await page.goto(urlDoc);

    await expect(page.locator('h2').getByText(docTitle)).toBeVisible();
    await page.getByRole('button', { name: 'Share' }).click();
    await expect(
      page.getByText('Read only, you cannot edit this document'),
    ).toBeHidden();

    const shareModal = page.getByLabel('Share modal');

    await expect(
      shareModal.getByRole('combobox', {
        name: 'Visibility',
      }),
    ).toHaveAttribute('disabled');
    await expect(shareModal.getByText('Search by email')).toBeHidden();
    await expect(shareModal.getByLabel('List members card')).toBeHidden();
  });
});
