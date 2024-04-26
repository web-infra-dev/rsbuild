import webpack from 'webpack';
import { pickRsbuildConfig, stringifyConfig } from '../src/config';

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
