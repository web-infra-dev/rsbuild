import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should generate meta tags correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { foo: path.resolve(__dirname, './src/foo.js') },
    rsbuildConfig: {
      html: {
        meta: {
          foo: 'bar',
          description: 'a description of the page',
          'http-equiv': {
            'http-equiv': 'x-ua-compatible',
            content: 'ie=edge',
          },
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];

  expect(html).toContain('<meta name="foo" content="bar">');
  expect(html).toContain(
    '<meta name="description" content="a description of the page">',
  );
  expect(html).toContain(
    '<meta http-equiv="x-ua-compatible" content="ie=edge">',
  );
});

test('should generate meta tags correctly when using custom HTML template', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { foo: path.resolve(__dirname, './src/foo.js') },
    rsbuildConfig: {
      html: {
        meta: {
          foo: 'bar',
        },
        template: path.resolve(__dirname, './src/empty.html'),
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];

  expect(html).toContain('<meta name="foo" content="bar">');
});

test('should generate meta tags via function correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      foo: path.resolve(__dirname, './src/foo.js'),
      bar: path.resolve(__dirname, './src/foo.js'),
    },
    rsbuildConfig: {
      html: {
        meta({ value, entryName }) {
          if (entryName === 'bar') {
            return {
              ...value,
              description: 'this is bar',
            };
          }

          return {
            description: 'this is foo',
            'http-equiv': {
              'http-equiv': 'x-ua-compatible',
              content: 'ie=edge',
            },
          };
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];

  expect(fooHtml).toContain('<meta name="description" content="this is foo">');
  expect(fooHtml).toContain(
    '<meta http-equiv="x-ua-compatible" content="ie=edge">',
  );
  expect(fooHtml).not.toContain(
    '<meta name="description" content="this is bar">',
  );

  const barHtml =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHtml).toContain('<meta name="description" content="this is bar">');
  expect(barHtml).not.toContain(
    '<meta http-equiv="x-ua-compatible" content="ie=edge">',
  );
});

// TODO run test in uniBuilder
test.skip('should generate meta tags for MPA correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      foo: path.resolve(__dirname, './src/foo.js'),
      bar: path.resolve(__dirname, './src/foo.js'),
    },
    rsbuildConfig: {
      html: {
        meta: {
          foo: 'bar',
        },
        // metaByEntries: {
        //   foo: {
        //     description: 'this is foo',
        //     'http-equiv': {
        //       'http-equiv': 'x-ua-compatible',
        //       content: 'ie=edge',
        //     },
        //   },
        //   bar: {
        //     description: 'this is bar',
        //   },
        // },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];

  expect(fooHtml).toContain('<meta name="foo" content="bar">');
  expect(fooHtml).toContain('<meta name="description" content="this is foo">');
  expect(fooHtml).toContain(
    '<meta http-equiv="x-ua-compatible" content="ie=edge">',
  );

  const barHtml =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHtml).toContain('<meta name="foo" content="bar">');
  expect(barHtml).toContain('<meta name="description" content="this is bar">');
  expect(barHtml).not.toContain(
    '<meta http-equiv="x-ua-compatible" content="ie=edge">',
  );
});
