import { createStubRsbuild } from '@scripts/test-helper';
import { pluginResolve } from '../src/plugins/resolve';

describe('plugin-resolve', () => {
  it('should apply default extensions correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].resolve?.extensions).toEqual([
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ]);
    expect(
      (bundlerConfigs[0].resolve?.tsConfig as { configFile: string })
        .configFile,
    ).toBeDefined();
  });

  it('should not apply tsConfigPath when aliasStrategy is "prefer-alias"', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
      rsbuildConfig: {
        resolve: {
          aliasStrategy: 'prefer-alias',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].resolve?.tsConfig).toBeUndefined();
  });

  it('should allow to use source.alias to config alias', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
      rsbuildConfig: {
        source: {
          alias: {
            foo: 'bar',
          },
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].resolve?.alias?.foo).toEqual('bar');
  });

  it('should support source.alias to be a function', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
      rsbuildConfig: {
        source: {
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
