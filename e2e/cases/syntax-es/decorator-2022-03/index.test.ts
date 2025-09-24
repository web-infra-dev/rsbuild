import { expect, rspackTest, test } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';

test('should run stage 3 decorators correctly', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();

  expect(await page.evaluate('window.message')).toBe('hello');
  expect(await page.evaluate('window.method')).toBe('targetMethod');
  expect(await page.evaluate('window.field')).toBe('message');
});

rspackTest(
  'should run stage 3 decorators correctly with babel-plugin',
  async ({ page, buildPreview }) => {
    await buildPreview({
      plugins: [pluginBabel()],
    });

    expect(await page.evaluate('window.message')).toBe('hello');
    expect(await page.evaluate('window.method')).toBe('targetMethod');
    expect(await page.evaluate('window.field')).toBe('message');
  },
);

test.fail(
  'stage 3 decorators do not support decoratorBeforeExport',
  async ({ page, buildPreview }) => {
    // SyntaxError: Decorators must be placed *after* the 'export' keyword
    const rsbuild = await buildPreview({
      config: {
        source: {
          entry: {
            index: './src/decoratorBeforeExport.js',
          },
        },
      },
      plugins: [pluginBabel()],
    });

    expect(await page.evaluate('window.message')).toBe('hello');
    expect(await page.evaluate('window.method')).toBe('targetMethod');
    expect(await page.evaluate('window.field')).toBe('message');

    expect(
      rsbuild.logs.find((log) =>
        log.includes(
          'Using the export keyword between a decorator and a class is not allowed',
        ),
      ),
    ).toBeTruthy();
  },
);
