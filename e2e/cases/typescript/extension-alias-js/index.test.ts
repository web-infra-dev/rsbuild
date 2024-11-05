import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to import TS files with .js extension', async ({ page }) => {
  await build({
    cwd: __dirname,
    page,
  });
  expect(await page.evaluate(() => window.test)).toBe(1);
});
