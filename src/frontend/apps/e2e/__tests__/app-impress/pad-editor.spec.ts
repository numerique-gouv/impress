import { expect, test } from '@playwright/test';

import { keyCloakSignIn } from './common';

test.beforeEach(async ({ page, browserName }) => {
  await page.goto('/');
  await keyCloakSignIn(page, browserName);
});

test.describe('Pad Editor', () => {
  test('checks the Pad Editor interact correctly', async ({ page }) => {
    await page.getByText('My mocked pad').first().click();

    await expect(page.locator('h2').getByText('My mocked pad')).toBeVisible();

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');
    await expect(page.getByText('Hello World')).toBeVisible();
  });

  test('checks the Pad is connected to the webrtc server', async ({ page }) => {
    const webSocketPromise = page.waitForEvent('websocket', (webSocket) => {
      return webSocket.url().includes('ws://localhost:4444/');
    });

    await page.getByText('My mocked pad').first().click();
    await expect(page.locator('h2').getByText('My mocked pad')).toBeVisible();

    const webSocket = await webSocketPromise;
    expect(webSocket.url()).toBe('ws://localhost:4444/');

    const framesentPromise = webSocket.waitForEvent('framesent');

    await page.locator('.ProseMirror.bn-editor').click();
    await page.locator('.ProseMirror.bn-editor').fill('Hello World');

    const framesent = await framesentPromise;
    const payload = JSON.parse(framesent.payload as string) as {
      type: string;
    };

    const typeCases = ['publish', 'subscribe', 'unsubscribe', 'ping'];
    expect(typeCases.includes(payload.type)).toBeTruthy();
  });
});
