import path from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should emit local favicon to dist path', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        favicon: '../../../assets/icon.png',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).some((file) => file.endsWith('/icon.png')),
  ).toBeTruthy();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<link rel="icon" href="/icon.png">');
});

test('should allow `html.favicon` to be an absolute path', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        favicon: path.resolve(__dirname, '../../../assets/icon.png'),
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).some((file) => file.endsWith('/icon.png')),
  ).toBeTruthy();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<link rel="icon" href="/icon.png">');
});

test('should add type attribute for SVG favicon', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        favicon: '../../../assets/mobile.svg',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).some((file) => file.endsWith('/mobile.svg')),
  ).toBeTruthy();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="icon" href="/mobile.svg" type="image/svg+xml">',
  );
});

test('should apply asset prefix to favicon URL', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        favicon: '../../../assets/icon.png',
      },
      output: {
        assetPrefix: 'https://www.example.com',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="icon" href="https://www.example.com/icon.png">',
  );
});

test('should allow favicon to be a CDN URL', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        favicon: 'https://foo.com/icon.png',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain('<link rel="icon" href="https://foo.com/icon.png">');
});

test('should generate favicon via function correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          foo: path.resolve(__dirname, './src/foo.js'),
          bar: path.resolve(__dirname, './src/foo.js'),
        },
      },
      html: {
        favicon({ entryName }) {
          const icons: Record<string, string> = {
            foo: 'https://example.com/foo.ico',
            bar: 'https://example.com/bar.ico',
          };
          return icons[entryName] || 'https://example.com/default.ico';
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain(
    '<link rel="icon" href="https://example.com/foo.ico">',
  );

  const barHtml =
    files[Object.keys(files).find((file) => file.endsWith('bar.html'))!];
  expect(barHtml).toContain(
    '<link rel="icon" href="https://example.com/bar.ico">',
  );
});
