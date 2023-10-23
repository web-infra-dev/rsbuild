import { pluginResolve } from '@/plugins/resolve';
import { createStubRsbuild } from '../helper';

describe('plugin-resolve', () => {
  it('should apply default extensions correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
    });
    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.resolve?.extensions).toEqual([
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
      rsbuildConfig: {
        source: {
          compileJsDataURI: true,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should support custom webpack resolve.mainFields', async () => {
    const mainFieldsOption = ['main', 'test', 'browser', ['module', 'exports']];

    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
      rsbuildConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    const mainFieldsResult = ['main', 'test', 'browser', 'module', 'exports'];
    expect(config.resolve?.mainFields).toEqual(mainFieldsResult);
  });

  it('should support custom webpack resolve.mainFields by target', async () => {
    const mainFieldsOption = {
      web: ['main', 'browser'],
      node: ['main', 'node'],
    };

    const rsbuild = await createStubRsbuild({
      plugins: [pluginResolve()],
      rsbuildConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config.resolve?.mainFields).toEqual(mainFieldsOption.web);
  });
});
