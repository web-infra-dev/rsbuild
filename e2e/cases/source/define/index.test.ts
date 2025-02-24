import { build, dev, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to define global variables in development', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await gotoPage(page, rsbuild);

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  await rsbuild.close();
});

test('should allow to define global variables in production build', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await gotoPage(page, rsbuild);

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  await rsbuild.close();
});
