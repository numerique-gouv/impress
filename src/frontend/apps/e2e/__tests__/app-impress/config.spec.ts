import { expect, test } from '@playwright/test';

const config = {
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
};

test.describe('Config', () => {
  test('it checks the config api is called', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/config/') && response.status() === 200,
    );

    await page.goto('/');

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    expect(await response.json()).toStrictEqual(config);
  });

  test('it checks that sentry is trying to init from config endpoint', async ({
    page,
  }) => {
    await page.route('**/api/v1.0/config/', async (route) => {
      const request = route.request();
      if (request.method().includes('GET')) {
        await route.fulfill({
          json: {
            ...config,
            SENTRY_DSN: 'https://sentry.io/123',
          },
        });
      } else {
        await route.continue();
      }
    });

    const invalidMsg = 'Invalid Sentry Dsn: https://sentry.io/123';
    const consoleMessage = page.waitForEvent('console', {
      timeout: 5000,
      predicate: (msg) => msg.text().includes(invalidMsg),
    });

    await page.goto('/');

    expect((await consoleMessage).text()).toContain(invalidMsg);
  });

  test('it checks that theme is configured from config endpoint', async ({
    page,
  }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/config/') && response.status() === 200,
    );

    await page.goto('/');

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    const jsonResponse = await response.json();
    expect(jsonResponse.FRONTEND_THEME).toStrictEqual('dsfr');

    const footer = page.locator('footer').first();
    // alt 'Gouvernement Logo' comes from the theme
    await expect(footer.getByAltText('Gouvernement Logo')).toBeVisible();
  });
});
