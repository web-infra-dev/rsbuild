import { pluginResolve } from '@/plugins/resolve';
import { createStubRsbuild } from '@rsbuild/test-helper';

describe('plugin-resolve', () => {
  it('should apply default extensions correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].resolve?.extensions).toEqual([
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.json',
    ]);
    expect(bundlerConfigs[0].resolve?.tsConfigPath).toBeUndefined();
  });

  it('should not apply tsConfigPath when aliasStrategy is "prefer-alias"', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
      rsbuildConfig: {
        source: {
          aliasStrategy: 'prefer-alias',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0].resolve?.tsConfigPath).toBeUndefined();
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

    expect(bundlerConfigs[0].resolve?.alias).toEqual({
      foo: 'bar',
    });
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
