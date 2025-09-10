import { build, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginBabel } from '@rsbuild/plugin-babel';

test('should run stage 3 decorators correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.message')).toBe('hello');
  expect(await page.evaluate('window.method')).toBe('targetMethod');
  expect(await page.evaluate('window.field')).toBe('message');

  await rsbuild.close();
});

rspackOnlyTest(
  'should run stage 3 decorators correctly with babel-plugin',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
      plugins: [pluginBabel()],
    });

    expect(await page.evaluate('window.message')).toBe('hello');
    expect(await page.evaluate('window.method')).toBe('targetMethod');
    expect(await page.evaluate('window.field')).toBe('message');

    await rsbuild.close();
  },
);

test.fail(
  'stage 3 decorators do not support decoratorBeforeExport',
  async ({ page }) => {
    // SyntaxError: Decorators must be placed *after* the 'export' keyword
    const rsbuild = await build({
      cwd: __dirname,
      page,
      rsbuildConfig: {
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
    await rsbuild.close();

    expect(
      rsbuild.logs.find((log) =>
        log.includes(
          'Using the export keyword between a decorator and a class is not allowed',
        ),
      ),
    ).toBeTruthy();

    await rsbuild.close();
  },
);
