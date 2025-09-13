import { expect, rspackTest, test } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

test('should use legacy decorators by default', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();

  expect(await page.evaluate('window.aaa')).toBe('hello');
  expect(await page.evaluate('window.bbb')).toBe('world');
  expect(await page.evaluate('window.ccc')).toBe('hello world');
});

test('should allow to use stage 3 decorators', async ({
  page,
  buildPreview,
}) => {
  await buildPreview({
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

rspackTest(
  'should use legacy decorators with babel-plugin',
  async ({ page, buildPreview }) => {
    await buildPreview({
      plugins: [pluginBabel()],
    });

    expect(await page.evaluate('window.aaa')).toBe('hello');
    expect(await page.evaluate('window.bbb')).toBe('world');
    expect(await page.evaluate('window.ccc')).toBe('hello world');
  },
);

rspackTest(
  'should allow to use stage 3 decorators with babel-plugin',
  async ({ page, buildPreview }) => {
    await buildPreview({
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
