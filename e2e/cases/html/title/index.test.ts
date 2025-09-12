import path from 'node:path';

import { expect, test } from '@e2e/helper';

test('should generate default title correctly', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      source: {
        entry: { foo: path.resolve(__dirname, './src/foo.js') },
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).toContain('<title>Rsbuild App</title>');
});

test('should allow setting empty title to unset the default title', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      source: {
        entry: { foo: path.resolve(__dirname, './src/foo.js') },
      },
      html: {
        title: '',
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).not.toContain('<title>');
});

test('should generate title correctly', async ({ build, buildOnly }) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      source: {
        entry: { foo: path.resolve(__dirname, './src/foo.js') },
      },
      html: {
        title: 'foo',
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).toContain('<title>foo</title>');
});

test('should generate title correctly when using custom HTML template', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      source: {
        entry: { foo: path.resolve(__dirname, './src/foo.js') },
      },
      html: {
        title: 'foo',
        template: path.resolve(__dirname, './src/empty.html'),
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).toContain('<title>foo</title>');
});

test('should generate title correctly when using htmlPlugin.options.title', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      source: {
        entry: { foo: path.resolve(__dirname, './src/foo.js') },
      },
      html: {
        title: 'foo',
        template: path.resolve(__dirname, './src/plugin-options-title.html'),
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).toContain('<title>foo</title>');
});

test('should generate title via function correctly', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      source: {
        entry: {
          foo: path.resolve(__dirname, './src/foo.js'),
          bar: path.resolve(__dirname, './src/foo.js'),
        },
      },
      html: {
        title({ entryName }) {
          return entryName;
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain('<title>foo</title>');

  const barHtml =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHtml).toContain('<title>bar</title>');
});

test('should not inject title if template already contains a title', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      source: {
        entry: { foo: path.resolve(__dirname, './src/foo.js') },
      },
      html: {
        title: 'Hello',
        template: './src/title.html',
      },
    },
  });
  const files = rsbuild.getDistFiles();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(html).toContain('<title>Page Title</title>');
});
