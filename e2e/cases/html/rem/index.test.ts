import path from 'node:path';
import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { pluginRem } from '@rsbuild/plugin-rem';

test('html with rem runtime code', async () => {
  const viewportValue =
    'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  const remRuntimeCodeKeyWord = 'setRootPixel';
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginRem()],
      source: {
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
        },
      },
      html: {
        meta: {
          viewport: viewportValue,
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).toContain(remRuntimeCodeKeyWord);

  expect(html).toContain(viewportValue);
  expect(html.indexOf(remRuntimeCodeKeyWord)).toBeGreaterThan(
    html.indexOf(viewportValue),
  );
});
