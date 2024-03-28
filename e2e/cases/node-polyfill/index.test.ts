import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test('should add node-polyfill when add node-polyfill plugin', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });
  await gotoPage(page, rsbuild);

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  const testBuffer = page.locator('#test-buffer');
  await expect(testBuffer).toHaveText('979899');

  const testQueryString = page.locator('#test-querystring');
  await expect(testQueryString).toHaveText('foo=bar');

  await rsbuild.close();
});
