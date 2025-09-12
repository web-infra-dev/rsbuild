import { expect, rspackOnlyTest, test } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

test('should use legacy decorators by default', async ({ page, build }) => {
  const rsbuild = await build();

  expect(await page.evaluate('window.aaa')).toBe('hello');
  expect(await page.evaluate('window.bbb')).toBe('world');
  expect(await page.evaluate('window.ccc')).toBe('hello world');
});

test('should allow to use stage 3 decorators', async ({ page, build }) => {
  const rsbuild = await build({
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
});

rspackOnlyTest(
  'should use legacy decorators with babel-plugin',
  async ({ page, build }) => {
    const rsbuild = await build({
      plugins: [pluginBabel()],
    });

    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.ccc')).toBe('hello world');
  },
);

rspackOnlyTest(
  'should allow to use stage 3 decorators with babel-plugin',
  async ({ page, build }) => {
    const rsbuild = await build({
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
  },
);
