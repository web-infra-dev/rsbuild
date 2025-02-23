import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to import TSX files with .jsx extension', async ({
  page,
}) => {
  await build({
    cwd: __dirname,
    page,
  });
  expect(await page.evaluate(() => window.test)).toBe(1);
});
