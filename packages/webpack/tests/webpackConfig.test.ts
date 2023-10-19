import { expect, describe, it } from 'vitest';
import { pluginBasic } from '@/plugins/basic';
import { createStubRsbuild } from './helper';
import { pluginBabel } from '@/plugins/babel';
import { pluginAntd } from '@rsbuild/core/plugins/antd';

describe('webpackConfig', () => {
  it('should allow tools.webpack to return config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
      builderConfig: {
        tools: {
          webpack(config) {
            return {
              ...config,
              devtool: 'eval',
            };
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to modify config object', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
      builderConfig: {
        tools: {
          webpack(config) {
            config.devtool = 'eval';
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to be an object', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
      builderConfig: {
        tools: {
          webpack: {
            devtool: 'eval',
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to be an array', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
      builderConfig: {
        tools: {
          webpack: [
            {
              devtool: 'eval',
            },
            (config) => {
              config.devtool = 'source-map';
            },
          ],
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should provide mergeConfig util in tools.webpack function', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
      builderConfig: {
        tools: {
          webpack: (config, { mergeConfig }) => {
            return mergeConfig(config, {
              devtool: 'eval',
            });
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to use tools.webpackChain to modify config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
      builderConfig: {
        tools: {
          webpackChain(chain) {
            chain.devtool('eval');
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpackChain to be an array', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBasic()],
      builderConfig: {
        tools: {
          webpackChain: [
            (chain) => {
              chain.devtool('eval');
            },
            (chain) => {
              chain.devtool('source-map');
            },
          ],
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should export HtmlWebpackPlugin instance', async () => {
    await createStubRsbuild({
      builderConfig: {
        tools: {
          webpack(config, utils) {
            expect(utils.HtmlWebpackPlugin.version).toEqual(5);
          },
        },
      },
    });
  });

  it('should allow to append and prepend plugins', async () => {
    const rsbuild = await createStubRsbuild({
      builderConfig: {
        tools: {
          webpack(config, utils) {
            utils.appendPlugins([new utils.webpack.DefinePlugin({ foo: '1' })]);
            utils.prependPlugins([
              new utils.webpack.DefinePlugin({ foo: '2' }),
            ]);
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.plugins).toMatchSnapshot();
  });

  it('should allow to remove plugins', async () => {
    const rsbuild = await createStubRsbuild({
      builderConfig: {
        tools: {
          webpack(config, utils) {
            utils.appendPlugins([new utils.webpack.DefinePlugin({ foo: '1' })]);
            utils.prependPlugins([
              new utils.webpack.DefinePlugin({ foo: '2' }),
            ]);
            utils.removePlugin('DefinePlugin');
          },
        },
      },
      plugins: [],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.plugins).toEqual([]);
  });

  it('should allow to add rules', async () => {
    const newRule = {
      test: /\.foo$/,
      loader: 'foo-loader',
    };

    const rsbuild = await createStubRsbuild({
      builderConfig: {
        tools: {
          webpack(config, utils) {
            utils.addRules(newRule);
          },
        },
      },
      plugins: [],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.module?.rules).toEqual([newRule]);
  });

  it('should set proper pluginImport option in Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      builderConfig: {
        source: {
          transformImport: [
            {
              libraryName: 'foo',
              camelToDashComponentName: true,
            },
          ],
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    const babelRules = config.module!.rules?.filter((item) => {
      // @ts-expect-error item has use
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });

  it('should not set default pluginImport for Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel(), pluginAntd()],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    const babelRules = config.module!.rules?.filter((item) => {
      // @ts-expect-error item has use
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });

  it('should not have any pluginImport in Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel(), pluginAntd()],
      builderConfig: {
        source: {
          transformImport: false,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    const babelRules = config.module!.rules?.filter((item) => {
      // @ts-expect-error item has use
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });
});
