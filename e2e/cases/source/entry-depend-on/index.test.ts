import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to set entry description object with dependOn', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild, 'foo');
  expect(await page.evaluate('window.test')).toBe('foo');

  await gotoPage(page, rsbuild, 'bar');
  expect(await page.evaluate('window.test')).toBe('foo-bar');

  await gotoPage(page, rsbuild, 'baz');
  expect(await page.evaluate('window.test')).toBe('foo-bar-baz');

  await rsbuild.close();
});
