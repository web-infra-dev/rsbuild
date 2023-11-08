import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should generate default title correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { foo: path.resolve(__dirname, './src/foo.js') },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).toContain('<title>Rsbuild App</title>');
});

test('should generate title correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { foo: path.resolve(__dirname, './src/foo.js') },
    rsbuildConfig: {
      html: {
        title: 'foo',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).toContain('<title>foo</title>');
});

test('should generate title correctly when using custom HTML template', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { foo: path.resolve(__dirname, './src/foo.js') },
    rsbuildConfig: {
      html: {
        title: 'foo',
        template: path.resolve(__dirname, './src/empty.html'),
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).toContain('<title>foo</title>');
});

test('should generate title via function correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      foo: path.resolve(__dirname, './src/foo.js'),
      bar: path.resolve(__dirname, './src/foo.js'),
    },
    rsbuildConfig: {
      html: {
        title({ entryName }) {
          return entryName;
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain('<title>foo</title>');

  const barHtml =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHtml).toContain('<title>bar</title>');
});

// TODO move to uni-builder
test.skip('should generate title for MPA correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      foo: path.resolve(__dirname, './src/foo.js'),
      bar: path.resolve(__dirname, './src/foo.js'),
    },
    rsbuildConfig: {
      html: {
        title: 'default',
        // titleByEntries: {
        //   foo: 'foo',
        // },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain('<title>foo</title>');

  const barHtml =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHtml).toContain('<title>default</title>');
});
