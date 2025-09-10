import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const utf8Str = `你好 world! I'm 🦀`;
const asciiStr = `\\u{4F60}\\u{597D} world! I'm \\u{1F980}`;

rspackOnlyTest(
  'should allow to set output.charset to ascii in development mode',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        dev: {
          writeToDisk: true,
        },
        output: {
          charset: 'ascii',
        },
      },
    });

    expect(await page.evaluate('window.a')).toBe(utf8Str);

    const files = await rsbuild.getDistFiles();
    const [, content] = Object.entries(files).find(
      ([name]) => name.endsWith('.js') && name.includes('static/js/index'),
    )!;

    expect(content.includes(asciiStr)).toBeTruthy();

    await rsbuild.close();
  },
);

test('should allow to set output.charset to ascii in production mode', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      output: {
        charset: 'ascii',
      },
    },
  });

  expect(await page.evaluate('window.a')).toBe(utf8Str);

  const content = await rsbuild.getIndexBundle();
  expect(content.includes(asciiStr)).toBeTruthy();

  await rsbuild.close();
});

test('should allow to set output.charset to utf8 in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
      output: {
        charset: 'utf8',
      },
    },
    page,
  });

  expect(await page.evaluate('window.a')).toBe(utf8Str);

  const files = await rsbuild.getDistFiles();
  const [, content] = Object.entries(files).find(
    ([name]) => name.endsWith('.js') && name.includes('static/js/index'),
  )!;

  expect(content.includes(utf8Str)).toBeTruthy();

  await rsbuild.close();
});

test('should allow to set output.charset to utf8 in production mode', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        charset: 'utf8',
      },
    },
    page,
  });

  expect(await page.evaluate('window.a')).toBe(utf8Str);

  const content = await rsbuild.getIndexBundle();
  expect(content.includes(utf8Str)).toBeTruthy();

  await rsbuild.close();
});
