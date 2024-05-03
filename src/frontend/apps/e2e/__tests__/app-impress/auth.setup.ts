import { test as setup } from '@playwright/test';

import { signIn } from './common';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, browserName }) => {
  await page.goto('/');
  await signIn(page, browserName);
  await page.context().storageState({ path: authFile });
});
