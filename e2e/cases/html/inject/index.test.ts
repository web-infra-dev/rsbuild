import path from 'node:path';
import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { pluginRem } from '@rsbuild/plugin-rem';

test('injection script order should be as expected', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [
      pluginRem({
        inlineRuntime: false,
      }),
    ],
    rsbuildConfig: {
      html: {
        inject: false,
        template: './static/index.html',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  // rem => normal resource => template custom resource
  expect(
    html.indexOf('/js/convert-rem') < html.indexOf('/js/index'),
  ).toBeTruthy();
  expect(html.indexOf('/js/index') < html.indexOf('/assets/a.js')).toBeTruthy();

  expect(html.indexOf('/js/index')).toBe(html.lastIndexOf('/js/index'));
});

test('should set inject via function correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
          foo: path.resolve(__dirname, './src/foo.js'),
        },
      },
      html: {
        inject({ value, entryName }) {
          return entryName === 'foo' ? 'body' : value;
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain('<body><div id="root"></div><script defer="defer"');

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(indexHtml).toContain(
    'content="width=device-width,initial-scale=1"><script defer="defer"',
  );
});
