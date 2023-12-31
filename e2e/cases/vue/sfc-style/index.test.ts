import { expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { rspackOnlyTest } from '@scripts/helper';

rspackOnlyTest('should build Vue sfc style correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const button = page.locator('#button');
  await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');

  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 255)');

  await rsbuild.close();
});
