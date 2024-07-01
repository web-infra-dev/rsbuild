import { join } from 'node:path';
import { createRsbuild } from '../src';

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
        source: {
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
        setup: (api) => {
          api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
            return mergeRsbuildConfig(config, {
              environments: {
                web: {
                  source: {
                    alias: {
                      '@common1': './src/common1',
                    },
                  },
                },
                web1: {
                  source: {
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
        source: {
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
        setup: (api) => {
          api.modifyEnvironmentConfig(
            (config, { name, mergeEnvironmentConfig }) => {
              if (name !== 'web') {
                return config;
              }

              return mergeEnvironmentConfig(config, {
                source: {
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

  it('should normalize environment config correctly', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        source: {
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
        source: {
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
});
