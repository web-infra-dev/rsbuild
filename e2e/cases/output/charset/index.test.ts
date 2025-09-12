import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const utf8Str = `你好 world! I'm 🦀`;
const asciiStr = `\\u{4F60}\\u{597D} world! I'm \\u{1F980}`;
const expectedObject = {
  Å: 'A',
  Ð: 'D',
  Þ: 'o',
  å: 'a',
  ð: 'd',
  þ: 'o',
  Д: 'A',
  '𝒩': 'a',
};

rspackOnlyTest(
  'should set output.charset to ascii in dev',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        output: {
          charset: 'ascii',
        },
      },
    });

    expect(await page.evaluate('window.testA')).toBe(utf8Str);
    expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

    const files = rsbuild.getDistFiles();
    const [, content] = Object.entries(files).find(
      ([name]) => name.endsWith('.js') && name.includes('static/js/index'),
    )!;

    expect(content.includes(asciiStr)).toBeTruthy();

    await rsbuild.close();
  },
);

test('should set output.charset to ascii in build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      output: {
        charset: 'ascii',
      },
    },
  });

  expect(await page.evaluate('window.testA')).toBe(utf8Str);
  expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

  const content = await rsbuild.getIndexBundle();
  expect(content.includes(asciiStr)).toBeTruthy();

  await rsbuild.close();
});

test('should use utf8 charset in dev by default', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.testA')).toBe(utf8Str);
  expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

  const files = rsbuild.getDistFiles();
  const [, content] = Object.entries(files).find(
    ([name]) => name.endsWith('.js') && name.includes('static/js/index'),
  )!;

  expect(content.includes(utf8Str)).toBeTruthy();

  await rsbuild.close();
});

test('should use utf8 charset in build by default', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.testA')).toBe(utf8Str);
  expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

  const content = await rsbuild.getIndexBundle();
  expect(content.includes(utf8Str)).toBeTruthy();

  await rsbuild.close();
});
