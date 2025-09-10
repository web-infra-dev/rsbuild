import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// https://github.com/web-infra-dev/rspack/issues/6470
test('should generate unique classname for different CSS Modules files in dev build', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  const test1Locator = page.locator('#test1');
  await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const test2Locator = page.locator('#test2');
  await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');

  await rsbuild.close();
});

test('should generate unique classname for different CSS Modules files in build', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  const test1Locator = page.locator('#test1');
  await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const test2Locator = page.locator('#test2');
  await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');

  await rsbuild.close();
});
