import { rspack } from '@rspack/core';
import { stringifyConfig } from '../src/config';

describe('stringifyConfig', () => {
  it('should stringify Rspack config correctly', async () => {
    const { DefinePlugin } = rspack;
    const config = {
      mode: 'development',
      plugins: [new DefinePlugin({ foo: 'bar' })],
    };

    expect(await stringifyConfig(config)).toMatchSnapshot();
  });

  it('should stringify Rspack config with verbose option correctly', async () => {
    const { DefinePlugin } = rspack;
    const config = {
      mode: 'development',
      output: {
        filename() {
          const a = '[name.js]';
          return a;
        },
      },
      plugins: [
        new DefinePlugin({
          foo: 'bar',
        }),
      ],
    };

    expect(await stringifyConfig(config, true)).toMatchSnapshot();
  });

  it('should stringify Rsbuild config correctly', async () => {
    const rsbuildConfig = {
      tools: {
        bundlerChain(chain: any) {
          chain.devtool('eval');
        },
      },
    };

    expect(await stringifyConfig(rsbuildConfig)).toMatchSnapshot();
  });
});
