import { expect } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

rspackOnlyTest('babel', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    plugins: [
      pluginBabel({
        babelLoaderOptions: (_, { addPlugins }) => {
          addPlugins([require('./plugins/myBabelPlugin')]);
        },
      }),
    ],
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.b')).toBe(10);

  await rsbuild.close();
});

rspackOnlyTest('babel exclude', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      source: {
        exclude: [/aa/],
      },
    },
    plugins: [
      pluginBabel({
        babelLoaderOptions: (_, { addPlugins }) => {
          addPlugins([require('./plugins/myBabelPlugin')]);
        },
      }),
    ],
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.b')).toBe(10);
  expect(await page.evaluate('window.bb')).toBeUndefined();

  await rsbuild.close();
});
