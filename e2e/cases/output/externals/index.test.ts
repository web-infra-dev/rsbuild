import { expect, test } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

test('should treat specified modules as externals', async ({ page, build }) => {
  await build({
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

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  const testExternal = page.locator('#test-external');
  await expect(testExternal).toHaveText('1');

  const externalVar = await page.evaluate('window.aa');

  expect(externalVar).toBeDefined();
});

test('should not externalize dependencies when target is web worker', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        target: 'web-worker',
        externals: {
          react: 'MyReact',
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];
  expect(content.includes('MyReact')).toBeFalsy();
});
