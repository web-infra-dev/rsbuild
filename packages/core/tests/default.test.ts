import { createStubRsbuild } from '@scripts/test-helper';
import type { RsbuildPlugin } from '../src';

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
        mode: 'development',
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
          rspack: (_config, { addRules, prependPlugins, appendRules }) => {
            addRules({
              test: /\.test$/,
              use: [
                {
                  loader: 'builtin:sass-loader',
                },
              ],
            });
            appendRules({
              test: /\.foo/,
              loader: 'foo-loader',
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
      setup(api) {
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
        "plugins": [
          {
            "name": "RsbuildCorePlugin",
          },
        ],
        "target": "node",
      }
    `);
  });

  it('test modifyBundlerChain rule format correctly', async () => {
    const testPlugin: RsbuildPlugin = {
      name: 'plugin-devtool',
      setup(api) {
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
        "plugins": [
          {
            "name": "RsbuildCorePlugin",
          },
        ],
      }
    `);
  });

  it('test modifyBundlerChain use builtinLoader', async () => {
    const testPlugin: RsbuildPlugin = {
      name: 'plugin-test',
      setup(api) {
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
        "plugins": [
          {
            "name": "RsbuildCorePlugin",
          },
        ],
      }
    `);
  });
});

describe('default value', () => {
  it('should apply server.base as assetPrefix default value', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        server: {
          base: '/base',
        },
      },
    });

    const {
      origin: { rsbuildConfig },
    } = await rsbuild.inspectConfig();
    expect(rsbuildConfig.dev.assetPrefix).toBe('/base');
    expect(rsbuildConfig.output.assetPrefix).toBe('/base');
  });

  it('should apply dev / output assetPrefix value correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        server: {
          base: '/base',
        },
        dev: {
          assetPrefix: '/base/aaa',
        },
        output: {
          assetPrefix: '/',
        },
      },
    });

    const {
      origin: { rsbuildConfig },
    } = await rsbuild.inspectConfig();
    expect(rsbuildConfig.dev.assetPrefix).toBe('/base/aaa');
    expect(rsbuildConfig.output.assetPrefix).toBe('/');
  });
});
