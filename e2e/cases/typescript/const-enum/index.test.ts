import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile const enum correctly', async ({ page }) => {
  await build({
    cwd: __dirname,
    page,
  });
  expect(await page.evaluate(() => window.test)).toBe('Fish 0, Cat 1');
  expect(await page.evaluate(() => window.test2)).toBe('Fish 0, Cat 1');
});
