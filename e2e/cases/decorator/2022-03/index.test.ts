import { test, expect } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test('should run stage 3 decorators correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.message')).toBe('hello');
  expect(await page.evaluate('window.method')).toBe('targetMethod');
  expect(await page.evaluate('window.field')).toBe('message');

  await rsbuild.close();
});
