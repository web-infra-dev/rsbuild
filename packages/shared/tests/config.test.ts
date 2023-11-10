import webpack from 'webpack';
import {
  getExtensions,
  stringifyConfig,
  pickRsbuildConfig,
} from '../src/config';

it('should get default extensions correctly', async () => {
  expect(getExtensions()).toEqual(['.js', '.jsx', '.mjs', '.json']);
});

it('should get extensions with ts', async () => {
  expect(
    getExtensions({
      isTsProject: true,
    }),
  ).toEqual(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']);
});

it('should get extensions with prefix', async () => {
  expect(
    getExtensions({
      resolveExtensionPrefix: '.web',
    }),
  ).toEqual([
    '.web.js',
    '.js',
    '.web.jsx',
    '.jsx',
    '.web.mjs',
    '.mjs',
    '.web.json',
    '.json',
  ]);
});

it('should get extensions with prefix by target', async () => {
  expect(
    getExtensions({
      target: 'node',
      resolveExtensionPrefix: {
        web: '.web',
        node: '.node',
      },
    }),
  ).toEqual([
    '.node.js',
    '.js',
    '.node.jsx',
    '.jsx',
    '.node.mjs',
    '.mjs',
    '.node.json',
    '.json',
  ]);
});

describe('stringifyConfig', () => {
  it('should stringify webpack config correctly', async () => {
    const { DefinePlugin } = webpack;
    const webpackConfig = {
      mode: 'development',
      plugins: [new DefinePlugin({ foo: 'bar' })],
    };

    expect(await stringifyConfig(webpackConfig)).toMatchSnapshot();
  });

  it('should stringify webpack config with verbose option correctly', async () => {
    const { DefinePlugin } = webpack;
    const webpackConfig = {
      mode: 'development',
      plugins: [
        new DefinePlugin({
          foo: 'bar',
          baz() {
            const a = 1;
            return a;
          },
        }),
      ],
    };

    expect(await stringifyConfig(webpackConfig, true)).toMatchSnapshot();
  });

  it('should stringify Rsbuild config correctly', async () => {
    const rsbuildConfig = {
      tools: {
        webpackChain(chain: any) {
          chain.devtool('eval');
        },
      },
    };

    expect(await stringifyConfig(rsbuildConfig)).toMatchSnapshot();
  });
});

describe('pickRsbuildConfig', () => {
  it('should pick correct keys from Rsbuild config', () => {
    const rsbuildConfig = {
      dev: {},
      html: {},
      tools: {},
      source: {},
      output: {},
      security: {},
      performance: {},
      extraKey: 'extraValue',
    };

    const result = pickRsbuildConfig(rsbuildConfig);

    expect(result).toEqual({
      dev: {},
      html: {},
      tools: {},
      source: {},
      output: {},
      security: {},
      performance: {},
    });
  });

  it('should return empty object when Rsbuild config is empty', () => {
    const rsbuildConfig = {};
    const result = pickRsbuildConfig(rsbuildConfig);
    expect(result).toEqual({});
  });
});
