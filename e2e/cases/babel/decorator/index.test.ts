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
    expect(await page.evaluate('window["FooService"')).toBeTruthy();
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should support 2022-03 decorators in TypeScript',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
        source: {
          decorators: {
            version: '2022-03',
          },
        },
      },
      plugins: [pluginBabel()],
    });

    await gotoPage(page, rsbuild);
    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window["FooService"')).toBeTruthy();
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
            index: './src/_js.js',
          },
        },
      },
    });

    await gotoPage(page, rsbuild);
    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window["FooService"')).toBeTruthy();
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should support 2022-03 decorators in JavaScript',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
        source: {
          decorators: {
            version: '2022-03',
          },
          entry: {
            index: './src/_js.js',
          },
        },
      },
      plugins: [pluginBabel()],
    });

    await gotoPage(page, rsbuild);
    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window["FooService"')).toBeTruthy();
    await rsbuild.close();
  },
);
