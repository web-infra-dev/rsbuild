import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginBabel } from '@rsbuild/plugin-babel';

rspackOnlyTest(
  'should support legacy decorators and source.decorators.version in TypeScript',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
      plugins: [pluginBabel()],
    });

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
      page,
      plugins: [pluginBabel()],
      rsbuildConfig: {
        source: {
          entry: {
            index: './src/jsIndex.js',
          },
        },
      },
    });

    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.FooService')).toBeTruthy();
    await rsbuild.close();
  },
);
