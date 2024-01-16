import { expect } from '@playwright/test';
import { rspackOnlyTest } from '@scripts/helper';
import { build, gotoPage } from '@scripts/shared';

rspackOnlyTest('decorator legacy(default)', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello world');

  if (rsbuild.providerType !== 'rspack') {
    expect(await page.evaluate('window.ccc')).toContain(
      "Cannot assign to read only property 'message' of object",
    );
  }

  await rsbuild.close();
});
