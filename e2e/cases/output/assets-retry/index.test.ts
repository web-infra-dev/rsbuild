import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';

test('should inline assets retry runtime code to html by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginAssetsRetry()],
    rsbuildConfig: {
      tools: {
        htmlPlugin: (config: any) => {
          // minifyJS will minify function name
          if (typeof config.minify === 'object') {
            config.minify.minifyJS = false;
            config.minify.minifyCSS = false;
          }
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const htmlFile = Object.keys(files).find((file) => file.endsWith('.html'));

  expect(htmlFile).toBeTruthy();
  expect(files[htmlFile!].includes('function retry')).toBeTruthy();
});

test('should extract assets retry runtime code when inlineScript is false', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [
      pluginAssetsRetry({
        inlineScript: false,
      }),
    ],
  });
  const files = await rsbuild.unwrapOutputJSON();

  const htmlFile = Object.keys(files).find((file) => file.endsWith('.html'));
  const retryFile = Object.keys(files).find(
    (file) => file.includes('/assets-retry') && file.endsWith('.js'),
  );

  expect(htmlFile).toBeTruthy();
  expect(retryFile).toBeTruthy();
  expect(files[htmlFile!].includes('function retry')).toBeFalsy();
});
