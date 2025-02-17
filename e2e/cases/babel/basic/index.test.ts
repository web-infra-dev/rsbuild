import { createRequire } from 'node:module';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginBabel } from '@rsbuild/plugin-babel';

const require = createRequire(import.meta.url);

rspackOnlyTest(
  'should run babel with babel plugin correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: import.meta.dirname,
      page,
      plugins: [
        pluginBabel({
          babelLoaderOptions: (_, { addPlugins }) => {
            addPlugins([require('./plugins/myBabelPlugin.cjs')]);
          },
        }),
      ],
    });

    expect(await page.evaluate('window.b')).toBe(10);

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should allow to exclude file from babel transformation',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: import.meta.dirname,
      page,
      rsbuildConfig: {
        source: {
          exclude: [/aa/],
        },
      },
      plugins: [
        pluginBabel({
          babelLoaderOptions: (_, { addPlugins }) => {
            addPlugins([require('./plugins/myBabelPlugin.cjs')]);
          },
        }),
      ],
    });

    expect(await page.evaluate('window.b')).toBe(10);
    expect(await page.evaluate('window.bb')).toBeUndefined();

    await rsbuild.close();
  },
);
