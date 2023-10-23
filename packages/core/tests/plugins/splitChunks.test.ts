import { expect, describe, it, test } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import {
  pluginSplitChunks,
  createDependenciesRegExp,
} from '@src/plugins/splitChunks';

test('createDependenciesRegExp', () => {
  const cases = {
    'react,react-dom,history':
      /[\\/]node_modules[\\/](react|react-dom|history)[\\/]/,
    '@babel/runtime': /[\\/]node_modules[\\/](@babel\/runtime)[\\/]/,
  };
  for (const [deps, expected] of Object.entries(cases)) {
    const actual = createDependenciesRegExp(...deps.split(','));
    expect(actual).toEqual(expected);
  }
});

describe('plugins/splitChunks', () => {
  const cases = [
    {
      name: 'should set split-by-experience config',
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    },
    {
      name: 'should set split-by-experience config correctly when polyfill is off',
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
        output: {
          polyfill: 'off',
        },
      },
    },
    // not support in rspack mode
    // {
    //   name: 'should set split-by-module config',
    //   rsbuildConfig: {
    //     performance: {
    //       chunkSplit: {
    //         strategy: 'split-by-module',
    //       },
    //     },
    //     output: {
    //       polyfill: 'entry',
    //     },
    //   },
    // },
    {
      name: 'should set single-vendor config',
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'single-vendor',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    },
    {
      name: 'should set single-size config',
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-size',
            minSize: 1000,
            maxSize: 5000,
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    },
    {
      name: 'should set all-in-one config',
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    },
    {
      name: 'should set custom config',
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'custom',
            forceSplitting: [/react/],
            splitChunks: {
              cacheGroups: {},
            },
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    },
    {
      name: 'should allow forceSplitting to be an object',
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'custom',
            forceSplitting: {
              axios: /axios/,
            },
            splitChunks: {
              cacheGroups: {},
            },
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
    },
    {
      name: 'should not split chunks when target is not',
      target: 'node',
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks()],
      rsbuildConfig: item.rsbuildConfig || {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
        output: {
          polyfill: 'entry',
        },
      },
      target: (item.target || 'web') as any,
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
