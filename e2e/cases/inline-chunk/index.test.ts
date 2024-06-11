import path from 'node:path';
import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RspackChain } from '@rsbuild/shared';

// use source-map for easy to test. By default, Rsbuild use hidden-source-map
const toolsConfig = {
  bundlerChain: (chain: RspackChain) => {
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

test('inline all scripts should work and emit all source maps', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
          another: path.resolve(__dirname, './src/another.js'),
        },
      },
      output: {
        inlineScripts: true,
      },
      tools: toolsConfig,
    },
  });

  await gotoPage(page, rsbuild);

  // test runtime
  expect(await page.evaluate('window.test')).toBe('aaaa');

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

  await rsbuild.close();
});

test('using RegExp to inline scripts', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        inlineScripts: /\/index\.\w+\.js$/,
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
    rsbuildConfig: {
      output: {
        inlineScripts({ size, name }) {
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
    rsbuildConfig: {
      output: {
        inlineStyles: /\/index\.\w+\.css$/,
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
    rsbuildConfig: {
      output: {
        inlineStyles({ size, name }) {
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
