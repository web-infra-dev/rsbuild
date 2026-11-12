import { createRsbuild, version } from '../src';

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
      config: {
        performance: {
          buildCache: {
            cacheDirectory: './node_modules/.cache/tmp',
          },
        },
      },
    },
    {
      name: 'should apply cacheDigest',
      config: {
        performance: {
          buildCache: {
            cacheDigest: ['a', 'b', 'c'],
          },
        },
      },
    },
    {
      name: 'should not apply cacheDigest',
      config: {
        performance: {
          buildCache: {
            cacheDigest: [],
          },
        },
      },
    },
    {
      name: 'should disable cache',
      config: {
        performance: {
          buildCache: false,
        },
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createRsbuild({
      config: item.config || {
        performance: {
          buildCache: true,
        },
      },
    });

    const [{ cache }] = await rsbuild.initConfigs();
    if (cache && typeof cache === 'object' && cache.type === 'persistent') {
      cache.version = cache.version?.replace(
        `rsbuild-${version}-`,
        'rsbuild-<version>-',
      );
    }

    expect(cache).toMatchSnapshot();
  });
});
