import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

test('should generate UMD bundle correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  // Browser env
  await page.goto(getHrefByEntryName('index', rsbuild.port));
  const test = page.locator('#test');
  await expect(test).toHaveText('2');

  // Node.js env
  const { double } = require('./dist/index.js');
  expect(double(1)).toEqual(2);

  await rsbuild.close();
});
