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

    expect(rsbuild.context.environments).toMatchSnapshot();
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
      origin: { rsbuildConfig },
    } = await rsbuild.inspectConfig();

    expect(rsbuildConfig.environments).toMatchSnapshot();
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

    await rsbuild.initConfigs();

    const environmentConfig = rsbuild.getNormalizedConfig({
      environment: 'web',
    });

    expect(environmentConfig).toMatchSnapshot();
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
      origin: { rsbuildConfig },
    } = await rsbuild.inspectConfig();

    expect(rsbuildConfig.environments).toMatchSnapshot();
  });
});
