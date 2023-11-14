import { join, resolve } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = resolve(__dirname, '../');

test('externals', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.js'),
    },
    runServer: true,
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        externals: {
          './aaa': 'aa',
        },
      },
      source: {
        preEntry: './src/ex.js',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  const testExternal = page.locator('#test-external');
  await expect(testExternal).toHaveText('1');

  const externalVar = await page.evaluate(`window.aa`);

  expect(externalVar).toBeDefined();

  rsbuild.clean();
  await rsbuild.close();
});

test('should not external dependencies when target is web worker', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    target: 'web-worker',
    entry: { index: resolve(fixtures, './src/index.js') },
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        externals: {
          react: 'MyReact',
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];
  expect(content.includes('MyReact')).toBeFalsy();

  rsbuild.clean();
});
