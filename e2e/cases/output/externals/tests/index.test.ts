import { join, resolve } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = resolve(__dirname, '../');

test('externals', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
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

  await page.goto(getHrefByEntryName('index', rsbuild.port));

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
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        targets: ['web-worker'],
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
