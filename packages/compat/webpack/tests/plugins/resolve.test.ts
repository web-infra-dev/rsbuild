import { pluginResolve } from '@/plugins/resolve';
import { createStubRsbuild } from '../helper';

describe('plugin-resolve', () => {
  it('should apply default extensions correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
    });
    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.resolve?.extensions).toEqual([
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.json',
    ]);
  });

  it('should allow to use source.alias to config webpack alias', async () => {
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
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config.resolve?.alias).toEqual({
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
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config.resolve?.alias).toEqual({
      foo: 'bar',
    });
  });

  it('should disable resolve.fullySpecified by default', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
