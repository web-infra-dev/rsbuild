import path from 'path';
import { expect, test } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';
import { BundlerChain } from '@rsbuild/shared';

const RUNTIME_CHUNK_NAME = 'bundler-runtime';

// Rspack will not output bundler-runtime source map, but it not necessary
// Identify whether the bundler-runtime chunk is included through some specific code snippets
const isRuntimeChunkInHtml = (html: string): boolean =>
  Boolean(html.includes('bundler-runtime') && html.includes('Loading chunk'));

// use source-map for easy to test. By default, Rsbuild use hidden-source-map
const toolsConfig = {
  bundlerChain: (chain: BundlerChain) => {
    chain.devtool('source-map');
  },
  htmlPlugin: (config: any) => {
    // minify will remove sourcemap comment
    if (typeof config.minify === 'object') {
      config.minify.minifyJS = false;
      config.minify.minifyCSS = false;
    }
  },
};

// TODO: uni-builder
test.skip('disableInlineRuntimeChunk', () => {
  let rsbuild: Awaited<ReturnType<typeof build>>;
  let files: Record<string, string>;

  test.beforeAll(async () => {
    rsbuild = await build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      runServer: true,
      rsbuildConfig: {
        tools: toolsConfig,
        output: {
          // disableInlineRuntimeChunk: true,
        },
      },
    });

    files = await rsbuild.unwrapOutputJSON(false);
  });

  test.afterAll(async () => {
    rsbuild.close();
  });

  test('should emit bundler-runtime', async ({ page }) => {
    // test runtime
    await page.goto(getHrefByEntryName('index', rsbuild.port));

    expect(await page.evaluate(`window.test`)).toBe('aaaa');

    // bundler-runtime file in output
    expect(
      Object.keys(files).some(
        (fileName) =>
          fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js'),
      ),
    ).toBe(true);
  });
});

// TODO: uni-builder
test.skip('inline runtime chunk by default', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    runServer: true,
    rsbuildConfig: {
      tools: toolsConfig,
    },
  });

  // test runtime
  await page.goto(getHrefByEntryName('index', rsbuild.port));

  expect(await page.evaluate(`window.test`)).toBe('aaaa');

  const files = await rsbuild.unwrapOutputJSON(false);

  // no bundler-runtime file in output
  expect(
    Object.keys(files).some(
      (fileName) =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js'),
    ),
  ).toBe(false);

  // found bundler-runtime file in html
  const indexHtml = files[path.resolve(__dirname, './dist/index.html')];

  expect(isRuntimeChunkInHtml(indexHtml)).toBeTruthy();

  rsbuild.close();
});

// TODO: uni-builder
test.skip('inline runtime chunk and remove source map when devtool is "hidden-source-map"', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    rsbuildConfig: {
      tools: {
        bundlerChain(chain) {
          chain.devtool('hidden-source-map');
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON(false);

  // should not emit source map of bundler-runtime
  expect(
    Object.keys(files).some(
      (fileName) =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js.map'),
    ),
  ).toBe(false);
});

// TODO: uni-builder
test.skip('inline runtime chunk by default with multiple entries', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
      another: path.resolve(__dirname, './src/another.js'),
    },
    rsbuildConfig: {
      tools: toolsConfig,
    },
  });
  const files = await rsbuild.unwrapOutputJSON(false);

  // no bundler-runtime file in output
  expect(
    Object.keys(files).some(
      (fileName) =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js'),
    ),
  ).toBe(false);

  // found bundler-runtime file in html
  const indexHtml = files[path.resolve(__dirname, './dist/index.html')];
  const anotherHtml = files[path.resolve(__dirname, './dist/another.html')];

  expect(isRuntimeChunkInHtml(indexHtml)).toBeTruthy();
  expect(isRuntimeChunkInHtml(anotherHtml)).toBeTruthy();
});

webpackOnlyTest(
  'inline all scripts should work and emit all source maps',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
        another: path.resolve(__dirname, './src/another.js'),
      },
      runServer: true,
      rsbuildConfig: {
        output: {
          enableInlineScripts: true,
        },
        tools: toolsConfig,
      },
    });

    await page.goto(getHrefByEntryName('index', rsbuild.port));

    // test runtime
    expect(await page.evaluate(`window.test`)).toBe('aaaa');

    const files = await rsbuild.unwrapOutputJSON(false);

    // no entry chunks or runtime chunks in output
    expect(
      Object.keys(files).filter(
        (fileName) => fileName.endsWith('.js') && !fileName.includes('/async/'),
      ).length,
    ).toEqual(0);

    // all source maps in output
    expect(
      Object.keys(files).filter((fileName) => fileName.endsWith('.js.map'))
        .length,
    ).toEqual(3);

    rsbuild.close();
  },
);

test('using RegExp to inline scripts', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    rsbuildConfig: {
      output: {
        enableInlineScripts: /\/index\.\w+\.js$/,
      },
      tools: toolsConfig,
    },
  });
  const files = await rsbuild.unwrapOutputJSON(false);

  // no index.js in output
  expect(
    Object.keys(files).filter(
      (fileName) => fileName.endsWith('.js') && fileName.includes('/index.'),
    ).length,
  ).toEqual(0);

  // all source maps in output
  expect(
    Object.keys(files).filter((fileName) => fileName.endsWith('.js.map'))
      .length,
  ).toBeGreaterThanOrEqual(2);
});

test('inline scripts by filename and file size', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    rsbuildConfig: {
      output: {
        enableInlineScripts({ size, name }) {
          return name.includes('index') && size < 10000;
        },
      },
      tools: toolsConfig,
    },
  });
  const files = await rsbuild.unwrapOutputJSON(false);

  // no index.js in output
  expect(
    Object.keys(files).filter(
      (fileName) => fileName.endsWith('.js') && fileName.includes('/index.'),
    ).length,
  ).toEqual(0);

  // all source maps in output
  expect(
    Object.keys(files).filter((fileName) => fileName.endsWith('.js.map'))
      .length,
  ).toBeGreaterThanOrEqual(2);
});

test('using RegExp to inline styles', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    rsbuildConfig: {
      output: {
        enableInlineStyles: /\/index\.\w+\.css$/,
      },
      tools: toolsConfig,
    },
  });
  const files = await rsbuild.unwrapOutputJSON(false);

  // no index.css in output
  expect(
    Object.keys(files).filter(
      (fileName) => fileName.endsWith('.css') && fileName.includes('/index.'),
    ).length,
  ).toEqual(0);
});

test('inline styles by filename and file size', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    rsbuildConfig: {
      output: {
        enableInlineStyles({ size, name }) {
          return name.includes('index') && size < 1000;
        },
      },
      tools: toolsConfig,
    },
  });
  const files = await rsbuild.unwrapOutputJSON(false);

  // no index.css in output
  expect(
    Object.keys(files).filter(
      (fileName) => fileName.endsWith('.css') && fileName.includes('/index.'),
    ).length,
  ).toEqual(0);
});
