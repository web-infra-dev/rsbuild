import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginBabel } from '@rsbuild/plugin-babel';

test('should use legacy decorators by default', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello');
  expect(await page.evaluate('window.bbb')).toBe('world');
  expect(await page.evaluate('window.ccc')).toBe('hello world');

  await rsbuild.close();
});

test('should allow to use stage 3 decorators', async ({ page }) => {
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
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.aaa')).toBe('hello');
  expect(await page.evaluate('window.bbb')).toBe('world');
  expect(await page.evaluate('window.ccc')).toBe('hello world');

  await rsbuild.close();
});

rspackOnlyTest(
  'should use legacy decorators with babel-plugin',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      plugins: [pluginBabel()],
    });

    await gotoPage(page, rsbuild);
    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.ccc')).toBe('hello world');

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should allow to use stage 3 decorators with babel-plugin',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      plugins: [pluginBabel()],
      rsbuildConfig: {
        source: {
          decorators: {
            version: '2022-03',
          },
        },
      },
    });

    await gotoPage(page, rsbuild);
    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.ccc')).toBe('hello world');

    await rsbuild.close();
  },
);
