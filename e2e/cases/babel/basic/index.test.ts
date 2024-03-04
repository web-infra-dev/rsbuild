import { expect } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

rspackOnlyTest(
  'should run babel with babel plugin correctly',
  async ({ page }) => {
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
  },
);

rspackOnlyTest(
  'should allow to exclude file from babel transformation',
  async ({ page }) => {
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
  },
);
