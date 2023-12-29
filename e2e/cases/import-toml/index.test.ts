import { expect } from '@playwright/test';
import { rspackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';

rspackOnlyTest('should import TOML correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  expect(await page.evaluate('window.age')).toBe(1);
  expect(await page.evaluate('window.b')).toBe('{"list":[1,2]}');

  await rsbuild.close();
});
