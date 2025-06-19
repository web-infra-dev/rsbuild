import { createStubRsbuild } from '@scripts/test-helper';
import { pluginCache } from '../src/plugins/cache';

describe('plugin-cache', () => {
  const cases = [
    {
      name: 'should add cache config correctly',
    },
    {
      name: 'should watch tsconfig change',
      context: {
        tsconfigPath: '/path/to/tsconfig.json',
      },
    },
    {
      name: 'should custom cache directory by user',
      rsbuildConfig: {
        performance: {
          buildCache: {
            cacheDirectory: './node_modules/.cache/tmp',
          },
        },
      },
    },
    {
      name: 'should apply cacheDigest',
      rsbuildConfig: {
        performance: {
          buildCache: {
            cacheDigest: ['a', 'b', 'c'],
          },
        },
      },
    },
    {
      name: 'should not apply cacheDigest',
      rsbuildConfig: {
        performance: {
          buildCache: {
            cacheDigest: [],
          },
        },
      },
    },
    {
      name: 'should disable cache',
      rsbuildConfig: {
        performance: {
          buildCache: false,
        },
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCache()],
      rsbuildConfig: item.rsbuildConfig || {
        performance: {
          buildCache: true,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
