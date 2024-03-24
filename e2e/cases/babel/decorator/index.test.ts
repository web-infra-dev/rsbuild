import test, { expect } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

test('should support legacy decorators and source.decorators.version in TypeScript', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    plugins: [pluginBabel()],
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello');
  expect(await page.evaluate('window.bbb')).toBe('world');
  expect(await page.evaluate('window.FooService')).toBeTruthy();
  await rsbuild.close();
});

test('should support legacy decorators and source.decorators.version in JavaScript', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    plugins: [pluginBabel()],
    rsbuildConfig: {
      source: {
        entry: {
          index: './src/_js.js',
        },
      },
    },
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello');
  expect(await page.evaluate('window.bbb')).toBe('world');
  expect(await page.evaluate('window.FooService')).toBeTruthy();
  await rsbuild.close();
});
