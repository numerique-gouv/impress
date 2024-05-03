import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('404', () => {
  test('Checks all the elements are visible', async ({ page }) => {
    await page.goto('unknown-page404');
    await expect(page.getByLabel('Image 404')).toBeVisible();
    await expect(page.getByText('Ouch')).toBeVisible();
    await expect(
      page.getByText(
        'It seems that the page you are looking for does not exist or cannot be displayed correctly.',
      ),
    ).toBeVisible();
    await expect(page.getByText('Back to home page')).toBeVisible();
  });

  test('checks go back to home page redirects to home page', async ({
    page,
  }) => {
    await page.goto('unknown-page404');
    await page.getByText('Back to home page').click();
    await expect(page).toHaveURL('/');
  });
});
