import { join } from 'node:path';
import {
  expect,
  findFile,
  getFileContent,
  rspackTest,
  test,
} from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('should generate prefetch link when prefetch is defined', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      plugins: [pluginReact()],
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

  const files = rsbuild.getDistFiles();

  const asyncFileName = findFile(files, /\/static\/js\/async\/.+\.js$/);
  const content = getFileContent(files, '.html');

  // test.js, test.css, image.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="https://www.foo.com${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link correctly when assetPrefix do not have a protocol', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      plugins: [pluginReact()],
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

  const files = rsbuild.getDistFiles();

  const asyncFileName = findFile(files, /\/static\/js\/async\/.+\.js$/);
  const content = getFileContent(files, '.html');

  expect(
    content.includes(
      `<link href="//www.foo.com${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link with include', async ({ build }) => {
  const rsbuild = await build({
    config: {
      plugins: [pluginReact()],
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

  const files = rsbuild.getDistFiles();

  const asyncFileName = findFile(files, 'image.png');
  const content = getFileContent(files, '.html');

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

test('should generate prefetch link with include array', async ({ build }) => {
  const rsbuild = await build({
    config: {
      plugins: [pluginReact()],
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

  const files = rsbuild.getDistFiles();

  const asyncFileName = findFile(files, 'image.png');
  const content = getFileContent(files, '.html');

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

test('should generate prefetch link with exclude array', async ({ build }) => {
  const rsbuild = await build({
    config: {
      plugins: [pluginReact()],
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

  const files = rsbuild.getDistFiles();

  const asyncFileName = findFile(files, 'image.png');
  const content = getFileContent(files, '.html');

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

test('should generate prefetch link by config (distinguish html)', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      plugins: [pluginReact()],
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

  const files = rsbuild.getDistFiles();

  const content = getFileContent(files, 'page1.html');

  // icon.png、test.js, test.css, image.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(4);

  const assetFileName = findFile(files, 'image.png');

  expect(
    content.includes(
      `<link href="${assetFileName.slice(
        assetFileName.indexOf('/static/image/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();

  const content2 = getFileContent(files, 'page2.html');

  // test.js, test.css, image.png
  expect(content2.match(/rel="prefetch"/g)?.length).toBe(3);
});

rspackTest(
  'should not generate prefetch link for inlined assets',
  async ({ build }) => {
    const rsbuild = await build({
      config: {
        plugins: [pluginReact()],
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

    const files = rsbuild.getDistFiles();
    const content = getFileContent(files, '.html');

    // image.png
    expect(content.match(/rel="prefetch"/g)?.length).toBe(1);
  },
);

rspackTest(
  'should not generate prefetch link for inlined assets with test option',
  async ({ build }) => {
    const rsbuild = await build({
      config: {
        plugins: [pluginReact()],
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

    const files = rsbuild.getDistFiles();
    const content = getFileContent(files, '.html');

    // image.png
    expect(content.match(/rel="prefetch"/g)?.length).toBe(1);
  },
);
