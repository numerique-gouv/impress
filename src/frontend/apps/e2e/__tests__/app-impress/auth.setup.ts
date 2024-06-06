import { test as setup } from '@playwright/test';

import { keyCloakSignIn } from './common';

setup('authenticate-chromium', async ({ page }) => {
  await page.goto('/');
  await keyCloakSignIn(page, 'chromium');
  await page
    .context()
    .storageState({ path: `playwright/.auth/user-chromium.json` });
});

setup('authenticate-webkit', async ({ page }) => {
  await page.goto('/');
  await keyCloakSignIn(page, 'webkit');
  await page
    .context()
    .storageState({ path: `playwright/.auth/user-webkit.json` });
});
