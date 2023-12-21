import { test, expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

test('should allow to use .pug template file', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const testPug = page.locator('#test-pug');
  await expect(testPug).toHaveText('Pug source code!');

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
