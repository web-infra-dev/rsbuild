import { join } from 'node:path';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('should generate preload link when preload is defined', async () => {
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
        preload: true,
      },
    },
  });

  const files = await rsbuild.getDistFiles();

  const asyncFileName = Object.keys(files).find(
    (file) =>
      file.includes('/static/js/async/') && !file.endsWith('.LICENSE.txt'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // test.js, test.css, image.png
  expect(content.match(/rel="preload"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="preload" as="script">`,
    ),
  ).toBeTruthy();
});

test('should generate preload link with duplicate', async () => {
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
        preload: {
          type: 'initial',
          dedupe: false,
        },
      },
    },
  });

  const files = await rsbuild.getDistFiles();

  const initialFileName = Object.keys(files).find(
    (file) =>
      file.includes('/static/js/') &&
      !file.includes('/static/js/async/') &&
      !file.endsWith('.LICENSE.txt'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  expect(
    content.includes(
      `<link href="${initialFileName.slice(
        initialFileName.indexOf('/static/js/'),
      )}" rel="preload" as="script">`,
    ),
  ).toBeTruthy();
});

test('should generate preload link with crossOrigin', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      html: {
        crossorigin: 'anonymous',
      },
      output: {
        assetPrefix: '//aaa.com',
      },
      performance: {
        preload: true,
      },
    },
  });

  const files = await rsbuild.getDistFiles();

  const asyncFileName = Object.keys(files).find(
    (file) =>
      file.includes('/static/js/async/') && !file.endsWith('.LICENSE.txt'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // test.js, test.css, image.png
  expect(content.match(/rel="preload"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="//aaa.com${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="preload" as="script" crossorigin="">`,
    ),
  ).toBeTruthy();
});

test('should generate preload link without crossOrigin when same origin', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/page1/index.ts'),
        },
      },
      html: {
        crossorigin: 'anonymous',
      },
      performance: {
        preload: true,
      },
    },
  });

  const files = await rsbuild.getDistFiles();

  const asyncFileName = Object.keys(files).find(
    (file) =>
      file.includes('/static/js/async/') && !file.endsWith('.LICENSE.txt'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // test.js, test.css, image.png
  expect(content.match(/rel="preload"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="preload" as="script">`,
    ),
  ).toBeTruthy();
});

test('should generate preload link with include', async () => {
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
        preload: {
          include: /\.png$/,
        },
      },
    },
  });

  const files = await rsbuild.getDistFiles();

  const asyncFileName = Object.keys(files).find((file) =>
    file.includes('/static/image/image'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // image.png
  expect(content.match(/rel="preload"/g)?.length).toBe(1);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/image/image'),
      )}" rel="preload" as="image">`,
    ),
  ).toBeTruthy();
});

test('should generate preload link with include array', async () => {
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
        preload: {
          include: [/\.png$/, (filename) => filename.includes('.js')],
        },
      },
    },
  });

  const files = await rsbuild.getDistFiles();

  const asyncFileName = Object.keys(files).find((file) =>
    file.includes('/static/image/image'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // image.png, test.js
  expect(content.match(/rel="preload"/g)?.length).toBe(2);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/image/image'),
      )}" rel="preload" as="image">`,
    ),
  ).toBeTruthy();
});

rspackOnlyTest(
  'should not generate preload link for inlined assets',
  async () => {
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
          preload: true,
        },
      },
    });

    const files = await rsbuild.getDistFiles();
    const [, content] = Object.entries(files).find(([name]) =>
      name.endsWith('.html'),
    )!;

    // image.png
    expect(content.match(/rel="preload" as="/g)?.length).toBe(1);
  },
);

rspackOnlyTest(
  'should not generate preload link for inlined assets with test option',
  async () => {
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
          preload: true,
        },
      },
    });

    const files = await rsbuild.getDistFiles();
    const [, content] = Object.entries(files).find(([name]) =>
      name.endsWith('.html'),
    )!;

    // image.png
    expect(content.match(/rel="preload" as="/g)?.length).toBe(1);
  },
);
