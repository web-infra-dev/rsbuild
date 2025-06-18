import { join } from 'node:path';
import { matchPlugin } from '@scripts/test-helper';
import { createRsbuild, type RsbuildPlugin } from '../src';

describe('environment config', () => {
  it('should normalize context correctly', async () => {
    process.env.NODE_ENV = 'development';
    const cwd = process.cwd();
    const rsbuild = await createRsbuild({
      cwd,
      rsbuildConfig: {
        environments: {
          ssr: {
            output: {
              target: 'node',
              distPath: {
                root: 'dist1/server',
              },
            },
          },
          web: {
            output: {
              distPath: {
                root: 'dist1',
              },
            },
          },
        },
      },
    });

    await rsbuild.initConfigs();

    expect(rsbuild.context.distPath).toBe(join(cwd, 'dist1'));
  });

  it('should support modify environment config by api.modifyRsbuildConfig', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        resolve: {
          alias: {
            '@common': './src/common',
          },
        },
        environments: {
          web: {
            source: {
              entry: {
                index: './src/index.client.js',
              },
            },
          },
          ssr: {
            source: {
              entry: {
                index: './src/index.server.js',
              },
            },
          },
        },
      },
    });

    rsbuild.addPlugins([
      {
        name: 'test-environment',
        setup(api) {
          api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
            return mergeRsbuildConfig(config, {
              environments: {
                web: {
                  resolve: {
                    alias: {
                      '@common1': './src/common1',
                    },
                  },
                },
                web1: {
                  resolve: {
                    alias: {
                      '@common1': './src/common1',
                    },
                  },
                },
              },
            });
          });
        },
      },
    ]);

    const {
      origin: { environmentConfigs },
    } = await rsbuild.inspectConfig();

    expect(environmentConfigs).toMatchSnapshot();
  });

  it('should support modify single environment config by api.modifyEnvironmentConfig', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        resolve: {
          alias: {
            '@common': './src/common',
          },
        },
        environments: {
          web: {
            source: {
              entry: {
                index: './src/index.client.js',
              },
            },
          },
          ssr: {
            source: {
              entry: {
                index: './src/index.server.js',
              },
            },
          },
        },
      },
    });

    rsbuild.addPlugins([
      {
        name: 'test-environment',
        setup(api) {
          api.modifyEnvironmentConfig(
            (config, { name, mergeEnvironmentConfig }) => {
              if (name !== 'web') {
                return config;
              }

              return mergeEnvironmentConfig(config, {
                resolve: {
                  alias: {
                    '@common1': './src/common1',
                  },
                },
              });
            },
          );
        },
      },
    ]);

    const {
      origin: { environmentConfigs },
    } = await rsbuild.inspectConfig();

    expect(environmentConfigs).toMatchSnapshot();
  });

  it('should support add single environment plugin', async () => {
    process.env.NODE_ENV = 'development';
    const plugin: (pluginId: string) => RsbuildPlugin = (pluginId) => ({
      name: 'test-environment',
      setup(api) {
        api.modifyEnvironmentConfig(
          (config, { name, mergeEnvironmentConfig }) => {
            return mergeEnvironmentConfig(config, {
              resolve: {
                alias: {
                  [pluginId]: name,
                },
              },
            });
          },
        );
      },
    });
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        environments: {
          web: {
            plugins: [plugin('web')],
          },
          ssr: {
            plugins: [plugin('ssr')],
          },
        },
      },
    });

    rsbuild.addPlugins([plugin('global')]);

    const {
      origin: { environmentConfigs },
    } = await rsbuild.inspectConfig();

    expect(
      Object.fromEntries(
        Object.entries(environmentConfigs).map(([name, config]) => [
          name,
          config.resolve.alias,
        ]),
      ),
    ).toMatchSnapshot();
  });

  it('should support run specified environment', async () => {
    process.env.NODE_ENV = 'development';

    const pluginLogs: string[] = [];

    const plugin: (pluginId: string) => RsbuildPlugin = (pluginId) => ({
      name: 'test-environment',
      setup: () => {
        pluginLogs.push(`run plugin in ${pluginId}`);
      },
    });

    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        environments: {
          web: {
            plugins: [plugin('web')],
          },
          ssr: {
            plugins: [plugin('ssr')],
          },
        },
      },
      environment: ['ssr'],
    });

    rsbuild.addPlugins([plugin('global')]);

    const {
      origin: { environmentConfigs },
    } = await rsbuild.inspectConfig();

    expect(Object.keys(environmentConfigs)).toEqual(['ssr']);
    expect(pluginLogs).toEqual(['run plugin in ssr', 'run plugin in global']);
  });

  it('should normalize environment config correctly', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        resolve: {
          alias: {
            '@common': './src/common',
          },
        },
        dev: {
          lazyCompilation: false,
        },
        environments: {
          web: {
            source: {
              entry: {
                index: './src/index.client.js',
              },
            },
            dev: {
              lazyCompilation: true,
            },
          },
          ssr: {
            output: {
              target: 'node',
            },
            dev: {
              assetPrefix: '/foo',
            },
            source: {
              entry: {
                index: './src/index.server.js',
              },
            },
          },
        },
      },
    });

    await rsbuild.initConfigs();

    expect(
      rsbuild.getNormalizedConfig({
        environment: 'web',
      }),
    ).toMatchSnapshot();

    expect(
      rsbuild.getNormalizedConfig({
        environment: 'ssr',
      }),
    ).toMatchSnapshot();
  });

  it('should print environment config when inspect config', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        resolve: {
          alias: {
            '@common': './src/common',
          },
        },
        environments: {
          web: {
            source: {
              entry: {
                index: './src/index.client.js',
              },
            },
          },
          ssr: {
            source: {
              entry: {
                index: './src/index.server.js',
              },
            },
          },
        },
      },
    });

    const {
      origin: { environmentConfigs },
    } = await rsbuild.inspectConfig();

    expect(environmentConfigs).toMatchSnapshot();
  });

  it('tools.rspack / bundlerChain can be configured in environment config', async () => {
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
        environments: {
          web: {
            tools: {
              rspack(config) {
                return {
                  ...config,
                  devtool: 'eval-source-map',
                };
              },
            },
          },
          node: {
            output: {
              target: 'node',
            },
            tools: {
              bundlerChain: (chain) => {
                chain.output.filename('bundle.js');
              },
            },
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(configs).toMatchSnapshot();
  });

  it('dev.hmr can be configured in environment config', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        environments: {
          web: {
            dev: {
              hmr: false,
            },
          },
          web2: {
            dev: {
              hmr: true,
            },
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs();

    expect(matchPlugin(configs[0], 'HotModuleReplacementPlugin')).toBeFalsy();
    expect(matchPlugin(configs[1], 'HotModuleReplacementPlugin')).toBeTruthy();
  });
});
