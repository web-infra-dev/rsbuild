import { createStubRsbuild } from './helper';

describe('webpackConfig', () => {
  it('should allow tools.webpack to return config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [],
      rsbuildConfig: {
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

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to modify config object', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [],
      rsbuildConfig: {
        tools: {
          webpack(config) {
            config.devtool = 'eval';
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to be an object', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [],
      rsbuildConfig: {
        tools: {
          webpack: {
            devtool: 'eval',
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to be an array', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [],
      rsbuildConfig: {
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

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should provide mergeConfig util in tools.webpack function', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [],
      rsbuildConfig: {
        tools: {
          webpack: (config, { mergeConfig }) => {
            return mergeConfig(config, {
              devtool: 'eval',
            });
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to use tools.webpackChain to modify config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [],
      rsbuildConfig: {
        tools: {
          webpackChain(chain) {
            chain.devtool('eval');
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpackChain to be an array', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [],
      rsbuildConfig: {
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

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });

  it('should export HtmlWebpackPlugin instance', async () => {
    await createStubRsbuild({
      rsbuildConfig: {
        tools: {
          webpack(_config, utils) {
            expect(utils.HtmlPlugin.version).toEqual(5);
            expect(utils.HtmlWebpackPlugin.version).toEqual(5);
          },
        },
      },
    });
  });

  it('should allow to append and prepend plugins', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        tools: {
          webpack(_config, utils) {
            utils.appendPlugins([new utils.webpack.DefinePlugin({ foo: '1' })]);
            utils.prependPlugins([
              new utils.webpack.DefinePlugin({ foo: '2' }),
            ]);
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.plugins).toMatchSnapshot();
  });

  it('should allow to remove plugins', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        tools: {
          webpack(_config, utils) {
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

    const config = await rsbuild.unwrapConfig();
    expect(config.plugins).toEqual([]);
  });

  it('should allow to add rules', async () => {
    const newRule = {
      test: /\.foo$/,
      loader: 'foo-loader',
    };

    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        tools: {
          webpack(_config, utils) {
            utils.addRules(newRule);
          },
        },
      },
      plugins: [],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.module?.rules).toEqual([newRule]);
  });
});
