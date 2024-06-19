import type { RsbuildPlugin } from '@rsbuild/shared';
import { createStubRsbuild } from '@scripts/test-helper';

describe('applyDefaultPlugins', () => {
  it('should apply default plugins correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';
    const rsbuild = await createStubRsbuild({});

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when prod', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({});

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when target = node', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'test';
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        output: {
          target: 'node',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
    process.env.NODE_ENV = NODE_ENV;
  });
});

describe('tools.rspack', () => {
  it('should match snapshot', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    class TestPlugin {
      readonly name: string = 'TestPlugin';

      apply() {}
    }

    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        tools: {
          rspack: (_config, { addRules, prependPlugins }) => {
            addRules({
              test: /\.test$/,
              use: [
                {
                  loader: 'builtin:sass-loader',
                },
              ],
            });
            prependPlugins([new TestPlugin()]);
          },
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});

describe('bundlerApi', () => {
  it('test modifyBundlerChain and api order', async () => {
    const testPlugin: RsbuildPlugin = {
      name: 'plugin-devtool',
      setup: (api) => {
        api.modifyBundlerChain((chain) => {
          chain.target('node');
          chain.devtool('cheap-module-source-map');
        });

        api.modifyRspackConfig((config) => {
          config.devtool = 'hidden-source-map';
        });
      },
    };

    const rsbuild = await createStubRsbuild({
      plugins: [testPlugin],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchInlineSnapshot(`
      {
        "devtool": "hidden-source-map",
        "target": "node",
      }
    `);
  });

  it('test modifyBundlerChain rule format correctly', async () => {
    const testPlugin: RsbuildPlugin = {
      name: 'plugin-devtool',
      setup: (api) => {
        api.modifyBundlerChain((chain) => {
          chain.module
            .rule('yaml')
            .type('javascript/auto')
            .test(/\.ya?ml$/)
            .use('yaml')
            .loader('../../compiled/yaml-loader');
        });
      },
    };

    const rsbuild = await createStubRsbuild({
      plugins: [testPlugin],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchInlineSnapshot(`
      {
        "module": {
          "rules": [
            {
              "test": /\\\\\\.ya\\?ml\\$/,
              "type": "javascript/auto",
              "use": [
                {
                  "loader": "../../compiled/yaml-loader",
                },
              ],
            },
          ],
        },
      }
    `);
  });

  it('test modifyBundlerChain use builtinLoader', async () => {
    const testPlugin: RsbuildPlugin = {
      name: 'plugin-test',
      setup: (api) => {
        api.modifyBundlerChain((chain) => {
          chain.module
            .rule('yaml')
            .type('javascript/auto')
            .test(/\.ya?ml$/)
            .use('yaml')
            .loader('builtin:yaml-loader');
        });
      },
    };

    const rsbuild = await createStubRsbuild({
      plugins: [testPlugin],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchInlineSnapshot(`
      {
        "module": {
          "rules": [
            {
              "test": /\\\\\\.ya\\?ml\\$/,
              "type": "javascript/auto",
              "use": [
                {
                  "loader": "builtin:yaml-loader",
                },
              ],
            },
          ],
        },
      }
    `);
  });
});
