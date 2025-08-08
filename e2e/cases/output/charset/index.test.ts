import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

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

    expect(await page.evaluate('window.a')).toBe('你好 world!');

    const files = await rsbuild.getDistFiles();

    const [, content] = Object.entries(files).find(
      ([name]) =>
        name.endsWith('.js') &&
        name.includes('static/js/async') &&
        name.includes('index_js'),
    )!;

    // in Rspack is: \\u4f60\\u597D world!
    expect(
      content.toLocaleLowerCase().includes('\\u4f60\\u597d world!'),
    ).toBeTruthy();

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

  expect(await page.evaluate('window.a')).toBe('你好 world!');

  const files = await rsbuild.getDistFiles();

  const [, content] = Object.entries(files).find(
    ([name]) => name.endsWith('.js') && name.includes('static/js/index'),
  )!;

  // in Rspack is: \\u4f60\\u597D world!
  expect(
    content.toLocaleLowerCase().includes('\\u4f60\\u597d world!'),
  ).toBeTruthy();

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

  expect(await page.evaluate('window.a')).toBe('你好 world!');

  const files = await rsbuild.getDistFiles();

  const [, content] = Object.entries(files).find(
    ([name]) => name.endsWith('.js') && name.includes('static/js/index'),
  )!;

  expect(content.includes('你好 world!')).toBeTruthy();

  await rsbuild.close();
});
