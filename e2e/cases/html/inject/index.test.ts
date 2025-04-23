import path from 'node:path';
import { build, normalizeNewlines, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
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
  const files = await rsbuild.getDistFiles();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  // rem => normal resource => template custom resource
  expect(
    html.indexOf('/js/convert-rem') < html.indexOf('/js/index'),
  ).toBeTruthy();
  expect(html.indexOf('/js/index') < html.indexOf('/assets/a.js')).toBeTruthy();

  expect(html.indexOf('/js/index')).toBe(html.lastIndexOf('/js/index'));
});

rspackOnlyTest('should set inject via function correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
          foo: path.resolve(__dirname, './src/foo.js'),
        },
      },
      output: {
        filenameHash: false,
      },
      html: {
        inject({ value, entryName }) {
          return entryName === 'foo' ? 'body' : value;
        },
      },
    },
  });
  const files = await rsbuild.getDistFiles();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(normalizeNewlines(fooHtml)).toEqual(
    `<!doctype html><html><head><title>Rsbuild App</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body><div id="root"></div><script defer src="/static/js/foo.js"></script></body></html>`,
  );

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(normalizeNewlines(indexHtml)).toEqual(
    `<!doctype html><html><head><title>Rsbuild App</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script defer src="/static/js/index.js"></script><link href="/static/css/index.css" rel="stylesheet"></head><body><div id="root"></div></body></html>`,
  );
});
