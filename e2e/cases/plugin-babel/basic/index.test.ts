import { expect, rspackTest } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

rspackTest(
  'should run babel with babel plugin correctly',
  async ({ page, buildPreview }) => {
    await buildPreview({
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

rspackTest(
  'should allow to exclude file from babel transformation',
  async ({ page, buildPreview }) => {
    await buildPreview({
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
