import { build, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginBabel } from '@rsbuild/plugin-babel';

test('should use legacy decorators by default', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.aaa')).toBe('hello');
  expect(await page.evaluate('window.bbb')).toBe('world');
  expect(await page.evaluate('window.ccc')).toBe('hello world');

  await rsbuild.close();
});

test('should allow to use stage 3 decorators', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      source: {
        decorators: {
          version: '2022-03',
        },
      },
    },
  });

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
      page,
      plugins: [pluginBabel()],
    });

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
      page,
      plugins: [pluginBabel()],
      rsbuildConfig: {
        source: {
          decorators: {
            version: '2022-03',
          },
        },
      },
    });

    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.ccc')).toBe('hello world');

    await rsbuild.close();
  },
);
