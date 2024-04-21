import { expect } from '@playwright/test';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

rspackOnlyTest(
  'should support legacy decorators and source.decorators.version in TypeScript',
  async ({ page }) => {
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
  },
);

rspackOnlyTest(
  'should support legacy decorators and source.decorators.version in JavaScript',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      plugins: [pluginBabel()],
      rsbuildConfig: {
        source: {
          entry: {
            index: './src/jsIndex.js',
          },
        },
      },
    });

    await gotoPage(page, rsbuild);
    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.FooService')).toBeTruthy();
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should work together with user custom @babel/preset-env config',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      plugins: [
        pluginBabel({
          babelLoaderOptions(options, { addPresets }) {
            // CWD is set to <project>/e2e by playwright, to find @babel/preset-env
            // correctly, manually set it to `__dirname`, better setting CWD to project root
            // for each test file with something like `setupFiles` in Vitest, playwright lacks though.
            options.cwd = __dirname;
            addPresets([
              [
                '@babel/preset-env',
                {
                  include: ['@babel/plugin-transform-class-properties'],
                },
              ],
            ]);
          },
        }),
      ],
      rsbuildConfig: {
        source: {
          entry: {
            index: './src/jsIndex.js',
          },
        },
      },
    });

    await gotoPage(page, rsbuild);
    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.FooService')).toBeTruthy();
    await rsbuild.close();
  },
);
