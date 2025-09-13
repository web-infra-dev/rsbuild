import { expect, rspackTest, test } from '@e2e/helper';

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

rspackTest(
  'should set output.charset to ascii in dev',
  async ({ page, dev }) => {
    const rsbuild = await dev({
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
  },
);

test('should set output.charset to ascii in build', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
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
});

test('should use utf8 charset in dev by default', async ({ page, dev }) => {
  const rsbuild = await dev();

  expect(await page.evaluate('window.testA')).toBe(utf8Str);
  expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

  const files = rsbuild.getDistFiles();
  const [, content] = Object.entries(files).find(
    ([name]) => name.endsWith('.js') && name.includes('static/js/index'),
  )!;

  expect(content.includes(utf8Str)).toBeTruthy();
});

test('should use utf8 charset in build by default', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview();

  expect(await page.evaluate('window.testA')).toBe(utf8Str);
  expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

  const content = await rsbuild.getIndexBundle();
  expect(content.includes(utf8Str)).toBeTruthy();
});
