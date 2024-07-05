import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc Routing', () => {
  test('checks alias docs url with homepage', async ({ page }) => {
    await expect(page).toHaveURL('/');

    const buttonCreateHomepage = page.getByRole('button', {
      name: 'Create a new document',
    });

    await expect(buttonCreateHomepage).toBeVisible();

    await page.goto('/docs');
    await expect(buttonCreateHomepage).toBeVisible();
    await expect(page).toHaveURL(/\/docs$/);
  });

  test('checks 404 on docs/[id] page', async ({ page }) => {
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(300);

    await page.goto('/docs/some-unknown-doc');
    await expect(
      page.getByText(
        'It seems that the page you are looking for does not exist or cannot be displayed correctly.',
      ),
    ).toBeVisible({
      timeout: 15000,
    });
  });
});
