import { expect, test } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

test('should treat specified modules as externals', async ({
  page,
  buildPreview,
}) => {
  await buildPreview({
    config: {
      plugins: [pluginReact()],
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
