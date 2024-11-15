import { expect, test } from '@playwright/test';

test.describe('Config', () => {
  test('it checks the config api is called', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/config/') && response.status() === 200,
    );

    await page.goto('/');

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    expect(await response.json()).toStrictEqual({
      COLLABORATION_SERVER_URL: 'ws://localhost:4444',
      ENVIRONMENT: 'development',
      FRONTEND_THEME: 'dsfr',
      MEDIA_BASE_URL: 'http://localhost:8083',
      LANGUAGES: [
        ['en-us', 'English'],
        ['fr-fr', 'French'],
        ['de-de', 'German'],
      ],
      LANGUAGE_CODE: 'en-us',
      SENTRY_DSN: null,
    });
  });
});
