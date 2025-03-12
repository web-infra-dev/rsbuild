import type { RspackPluginInstance } from '@rspack/core';
import { matchPlugin } from '@scripts/test-helper';
import { createRsbuild } from '../src';

describe('configure Rspack', () => {
  it('should allow tools.rspack to return config', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack(config) {
            return {
              ...config,
              devtool: 'eval',
            };
          },
        },
      },
    });

    const config = await rsbuild.initConfigs();
    expect(config[0].devtool).toEqual('eval');
  });

  it('should allow tools.rspack to modify config object', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack(config) {
            config.devtool = 'eval-cheap-source-map';
          },
        },
      },
    });

    const config = await rsbuild.initConfigs();
    expect(config[0].devtool).toEqual('eval-cheap-source-map');
  });

  it('should allow tools.rspack to be an object', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack: {
            devtool: 'eval',
          },
        },
      },
    });

    const config = await rsbuild.initConfigs();
    expect(config[0].devtool).toEqual('eval');
  });

  it('should allow tools.rspack to be an array', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack: [
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

    const config = await rsbuild.initConfigs();
    expect(config[0].devtool).toEqual('source-map');
  });

  it('should provide mergeConfig util in tools.rspack function', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack: (config, { mergeConfig }) => {
            return mergeConfig(config, {
              devtool: 'eval',
            });
          },
        },
      },
    });

    const config = await rsbuild.initConfigs();
    expect(config[0].devtool).toEqual('eval');
  });

  it('should allow to use tools.bundlerChain to modify config', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          bundlerChain(chain) {
            chain.devtool('eval');
          },
        },
      },
    });

    const config = await rsbuild.initConfigs();
    expect(config[0].devtool).toEqual('eval');
  });

  it('should allow tools.bundlerChain to be an array', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          bundlerChain: [
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

    const config = await rsbuild.initConfigs();
    expect(config[0].devtool).toEqual('source-map');
  });

  it('should expose HtmlWebpackPlugin instance via params', async () => {
    await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack(_config, utils) {
            expect(utils.HtmlPlugin.version).toEqual(5);
          },
        },
      },
    });
  });

  it('should allow to append and prepend plugins', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack(_config, utils) {
            utils.appendPlugins([new utils.rspack.DefinePlugin({ foo: '1' })]);
            utils.prependPlugins([
              new utils.rspack.BannerPlugin({ banner: 'hello' }),
            ]);
          },
        },
      },
    });

    const config = await rsbuild.initConfigs();
    const plugins = config[0].plugins || [];
    expect(plugins.length).toBeGreaterThan(2);
    expect((plugins[0] as RspackPluginInstance).name).toEqual('BannerPlugin');
    expect((plugins[plugins.length - 1] as RspackPluginInstance).name).toEqual(
      'DefinePlugin',
    );
  });

  it('should allow to remove plugins', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack(_config, utils) {
            utils.appendPlugins([new utils.rspack.DefinePlugin({ foo: '1' })]);
            utils.prependPlugins([new utils.rspack.DefinePlugin({ foo: '2' })]);
            utils.removePlugin('DefinePlugin');
          },
        },
      },
    });

    const config = await rsbuild.initConfigs();
    expect(matchPlugin(config[0], 'DefinePlugin')).toBeFalsy();
  });

  it('should allow to add rules', async () => {
    const newRule = {
      test: /\.foo$/,
      loader: 'foo-loader',
    };

    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        tools: {
          rspack(_config, utils) {
            utils.addRules(newRule);
          },
        },
      },
    });

    const config = await rsbuild.initConfigs();
    expect(config[0].module?.rules?.includes(newRule)).toBeTruthy();
  });
});
