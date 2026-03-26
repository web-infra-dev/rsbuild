import { expect, getFileContent, rspackTest, test } from '@e2e/helper';

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
      config: {
        output: {
          charset: 'ascii',
        },
      },
    });

    expect(await page.evaluate('window.testA')).toBe(utf8Str);
    expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

    const files = rsbuild.getDistFiles();
    const content = getFileContent(
      files,
      (name) => name.endsWith('.js') && name.includes('static/js/index'),
    );

    expect(content.includes(asciiStr)).toBeTruthy();
  },
);

rspackTest(
  'should set output.charset to ascii in build',
  async ({ page, buildPreview, logHelper }) => {
    const rsbuild = await buildPreview({
      config: {
        output: {
          charset: 'ascii',
        },
      },
    });

    expect(await page.evaluate('window.testA')).toBe(utf8Str);
    expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

    logHelper.restore();
    const content = await rsbuild.getIndexBundle();
    expect(
      content.includes("\\u4F60\\u597D world! I'm \\uD83E\\uDD80"),
    ).toBeTruthy();
  },
);

test('should use utf8 charset in dev by default', async ({ page, dev }) => {
  const rsbuild = await dev();

  expect(await page.evaluate('window.testA')).toBe(utf8Str);
  expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

  const files = rsbuild.getDistFiles();
  const content = getFileContent(
    files,
    (name) => name.endsWith('.js') && name.includes('static/js/index'),
  );

  expect(content.includes(utf8Str)).toBeTruthy();
});

rspackTest(
  'should use utf8 charset in build by default',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview();

    expect(await page.evaluate('window.testA')).toBe(utf8Str);
    expect(await page.evaluate('window.testB')).toStrictEqual(expectedObject);

    const content = await rsbuild.getIndexBundle();
    expect(content.includes(utf8Str)).toBeTruthy();
  },
);
