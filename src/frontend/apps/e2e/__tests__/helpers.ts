import { Locator } from '@playwright/test';

export async function waitForElementCount(
  locator: Locator,
  count: number,
  timeout: number,
) {
  let elapsedTime = 0;
  const interval = 200; // Check every 200 ms
  while (elapsedTime < timeout) {
    const currentCount = await locator.count();
    if (currentCount >= count) {
      return true;
    }
    await locator.page().waitForTimeout(interval); // Wait for the interval before checking again
    elapsedTime += interval;
  }
  throw new Error(
    `Timeout after ${timeout}ms waiting for element count to be at least ${count}`,
  );
}
