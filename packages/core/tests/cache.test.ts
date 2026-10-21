import { createRsbuild, type Rspack } from '../src';

describe('plugin-cache', () => {
  it.each<[Rspack.Configuration['stats'], Rspack.StatsOptions]>([
    [false, { preset: 'none' }],
    ['errors-only', { preset: 'errors-only' }],
    [{ warnings: false }, { warnings: false }],
  ])(
    'preserves stats %j when enabling cache diagnostics',
    async (stats, expected) => {
      const rsbuild = await createRsbuild({
        config: {
          performance: { buildCache: true, buildCacheDiagnostics() {} },
          tools: { rspack: { stats } },
        },
      });
      const [config] = await rsbuild.initConfigs();
      expect(config.stats).toMatchObject({ ...expected, cacheInfo: true });
    },
  );

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

    const config = (await rsbuild.initConfigs())[0];

    expect(config.cache).toMatchSnapshot();
  });
});
