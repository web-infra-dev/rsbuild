import { rspack } from '@rspack/core';
import type { RsbuildConfig } from '../src';
import { stringifyConfig } from '../src/inspectConfig';

describe('stringifyConfig', () => {
  it('should stringify Rspack config correctly', () => {
    const { DefinePlugin } = rspack;
    const config = {
      mode: 'development',
      plugins: [new DefinePlugin({ foo: 'bar' })],
    };

    expect(stringifyConfig(config)).toMatchSnapshot();
  });

  it('should stringify Rspack config with verbose option correctly', () => {
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

    expect(stringifyConfig(config, true)).toMatchSnapshot();
  });

  it('should stringify Rsbuild config correctly', () => {
    const config: RsbuildConfig = {
      tools: {
        bundlerChain(chain) {
          chain.devtool('eval');
        },
      },
    };

    expect(stringifyConfig(config)).toMatchSnapshot();
  });
});
