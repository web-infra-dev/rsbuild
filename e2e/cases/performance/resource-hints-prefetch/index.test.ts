import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('should generate prefetch link when prefetch is defined', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      output: {
        assetPrefix: 'https://www.foo.com',
      },
      performance: {
        prefetch: true,
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find(
    (file) =>
      file.includes('/static/js/async/') && !file.endsWith('.LICENSE.txt'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // test.js、test.css、image.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="https://www.foo.com${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link correctly when assetPrefix do not have a protocol', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      output: {
        assetPrefix: '//www.foo.com',
      },
      performance: {
        prefetch: true,
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find(
    (file) =>
      file.includes('/static/js/async/') && !file.endsWith('.LICENSE.txt'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  expect(
    content.includes(
      `<link href="//www.foo.com${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link with include', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      performance: {
        prefetch: {
          include: /\.png$/,
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find((file) =>
    file.includes('/static/image/image'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // image.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(1);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/image/image'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link with include array', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      performance: {
        prefetch: {
          include: [/\.png$/, (filename) => filename.includes('.js')],
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find((file) =>
    file.includes('/static/image/image'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // image.png, test.js
  expect(content.match(/rel="prefetch"/g)?.length).toBe(2);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/image/image'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link with exclude array', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      performance: {
        prefetch: {
          exclude: [/\.css$/, (filename) => filename.includes('.js')],
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find((file) =>
    file.includes('/static/image/image'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // image.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(1);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/image/image'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link by config (distinguish html)', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          page1: join(fixtures, 'src/page1/index.ts'),
          page2: join(fixtures, 'src/page2/index.ts'),
        },
      },
      performance: {
        prefetch: {
          type: 'all-chunks',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('page1.html'),
  )!;

  // icon.png、test.js、test.css、image.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(4);

  const assetFileName = Object.keys(files).find((file) =>
    file.includes('/static/image/'),
  )!;

  expect(
    content.includes(
      `<link href="${assetFileName.slice(
        assetFileName.indexOf('/static/image/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();

  const [, content2] = Object.entries(files).find(([name]) =>
    name.endsWith('page2.html'),
  )!;

  // test.js、test.css、image.png
  expect(content2.match(/rel="prefetch"/g)?.length).toBe(3);
});

test('should not generate prefetch link for inlined assets', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      output: {
        inlineScripts: true,
        inlineStyles: true,
      },
      performance: {
        prefetch: true,
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // image.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(1);
});

test('should not generate prefetch link for inlined assets with test option', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      output: {
        inlineScripts: {
          enable: 'auto',
          test: /\.js$/,
        },
        inlineStyles: {
          enable: 'auto',
          test: /\.css$/,
        },
      },
      performance: {
        prefetch: true,
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // image.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(1);
});
