import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should import JSON correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.age')).toBe(1);
  expect(await page.evaluate('window.b')).toBe('{"list":[1,2]}');

  await rsbuild.close();
});
