import { expect, test } from '@playwright/test';
import { dev, build, gotoPage } from '@e2e/helper';

test('should resolve package.json#imports correctly in dev build', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await gotoPage(page, rsbuild);
  const foo = page.locator('#foo');
  await expect(foo).toHaveText('foo');
  const test = page.locator('#test');
  await expect(test).toHaveText('test');

  await rsbuild.close();
});

test('should resolve package.json#imports correctly in prod build', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('foo');
  const test = page.locator('#test');
  await expect(test).toHaveText('test');

  await rsbuild.close();
});
