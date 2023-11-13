import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginRem } from '@rsbuild/plugin-rem';

test('Rsbuild injection script order should be as expected', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
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
    /(<script src="\/static\/js\/convert-rem).*(\/static\/js\/index).*(example.com\/assets\/a.js)/.test(
      html,
    ),
  ).toBeTruthy();
});

test('should set inject via function correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
      foo: path.resolve(__dirname, './src/foo.js'),
    },
    rsbuildConfig: {
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
  expect(indexHtml).toContain('</title><script defer="defer"');
});
