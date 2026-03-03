import { createRsbuild } from '../src';

describe('plugin-resolve', () => {
  it('should apply default extensions correctly', async () => {
    const rsbuild = await createRsbuild();

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].resolve?.extensions).toEqual([
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ]);
  });

  it('should allow customizing extensions', async () => {
    const rsbuild = await createRsbuild({
      config: {
        resolve: {
          extensions: ['.ts', '.js'],
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0].resolve?.extensions).toEqual(['.ts', '.js']);
  });

  it('should not apply tsConfigPath when aliasStrategy is "prefer-alias"', async () => {
    const rsbuild = await createRsbuild({
      config: {
        resolve: {
          aliasStrategy: 'prefer-alias',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].resolve?.tsConfig).toBeUndefined();
  });

  it('should allow using resolve.alias to configure alias', async () => {
    const rsbuild = await createRsbuild({
      config: {
        resolve: {
          alias: {
            foo: 'bar',
          },
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(
      (bundlerConfigs[0].resolve?.alias as Record<string, string>)?.foo,
    ).toEqual('bar');
  });

  it('should allow resolve.alias to be a function', async () => {
    const rsbuild = await createRsbuild({
      config: {
        resolve: {
          alias() {
            return {
              foo: 'bar',
            };
          },
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].resolve?.alias).toEqual({
      foo: 'bar',
    });
  });
});
