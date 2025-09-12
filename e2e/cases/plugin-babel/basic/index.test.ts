import { expect, rspackOnlyTest } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

rspackOnlyTest(
  'should run babel with babel plugin correctly',
  async ({ page, build }) => {
    const rsbuild = await build({
      plugins: [
        pluginBabel({
          babelLoaderOptions: (_, { addPlugins }) => {
            addPlugins([require('./plugins/myBabelPlugin')]);
          },
        }),
      ],
    });

    expect(await page.evaluate('window.b')).toBe(10);
  },
);

rspackOnlyTest(
  'should allow to exclude file from babel transformation',
  async ({ page, build }) => {
    const rsbuild = await build({
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

    expect(await page.evaluate('window.b')).toBe(10);
    expect(await page.evaluate('window.bb')).toBeUndefined();
  },
);
