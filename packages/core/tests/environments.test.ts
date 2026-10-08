import { join } from 'node:path';
import { matchPlugin } from '@scripts/test-helper';
import { createRsbuild, type RsbuildPlugin } from '../src';

describe('environment config', () => {
  it('should normalize context correctly', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const cwd = process.cwd();
    const rsbuild = await createRsbuild({
      cwd,
      config: {
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

  it('should support modifying environment config by api.modifyRsbuildConfig', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      config: {
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

  it('should support modifying single environment config by api.modifyEnvironmentConfig', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      config: {
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

  it('should support adding a single environment plugin', async () => {
    rs.stubEnv('NODE_ENV', 'development');
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
      config: {
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

  it('should support running the specified environment', async () => {
    rs.stubEnv('NODE_ENV', 'development');

    const pluginLogs: string[] = [];

    const plugin: (pluginId: string) => RsbuildPlugin = (pluginId) => ({
      name: 'test-environment',
      setup: () => {
        pluginLogs.push(`run plugin in ${pluginId}`);
      },
    });

    const rsbuild = await createRsbuild({
      config: {
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
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      config: {
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

  it('should print environment config when inspecting config', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      config: {
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

  it('should allow configuring tools.rspack and bundlerChain in environment config', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      config: {
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

  it('should allow configuring dev.hmr in environment config', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      config: {
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

  it('should skip lazy compilation when environment disables hmr and liveReload', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      config: {
        dev: {
          lazyCompilation: true,
        },
        environments: {
          web: {
            dev: {
              hmr: false,
              liveReload: false,
            },
          },
          web2: {
            dev: {
              hmr: false,
              liveReload: true,
            },
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs({ action: 'dev' });

    expect(configs[0].lazyCompilation).toBeFalsy();
    expect(configs[1].lazyCompilation).toBeTruthy();
  });

  it('should enable Node lazy compilation only with an explicit capability', async () => {
    rs.stubEnv('NODE_ENV', 'development');
    const rsbuild = await createRsbuild({
      config: {
        environments: {
          nodeDefault: {
            output: { target: 'node' },
          },
          nodeBoolean: {
            output: { target: 'node' },
            dev: { lazyCompilation: true },
          },
          nodeObject: {
            output: { target: 'node' },
            dev: { lazyCompilation: { imports: true, entries: false } },
          },
          nodeDisabled: {
            output: { target: 'node' },
            dev: { lazyCompilation: { node: false } },
          },
          nodeEnabled: {
            output: { target: 'node' },
            dev: {
              lazyCompilation: {
                node: true,
                imports: true,
                serverUrl: 'http://localhost:3000',
              },
            },
          },
          nodeAutoUrl: {
            output: { target: 'node' },
            dev: {
              lazyCompilation: {
                node: true,
              },
            },
          },
          web: {
            dev: {
              lazyCompilation: {
                node: true,
                imports: true,
                entries: false,
                serverUrl: 'http://localhost:3000',
              },
            },
          },
          worker: {
            output: { target: 'web-worker' },
            dev: {
              lazyCompilation: {
                node: true,
                serverUrl: 'http://localhost:3000',
              },
            },
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs({ action: 'dev' });
    const byName = Object.fromEntries(
      configs.map((config) => [config.name, config]),
    );

    for (const name of [
      'nodeDefault',
      'nodeBoolean',
      'nodeObject',
      'nodeDisabled',
      'worker',
    ]) {
      expect(byName[name].lazyCompilation).toBeFalsy();
      expect(
        matchPlugin(byName[name], 'HotModuleReplacementPlugin'),
      ).toBeFalsy();
    }
    expect(byName.nodeEnabled.lazyCompilation).toEqual({
      imports: true,
      entries: false,
      serverUrl: 'http://localhost:3000',
    });
    expect(
      matchPlugin(byName.nodeEnabled, 'HotModuleReplacementPlugin'),
    ).toBeTruthy();
    expect(byName.nodeAutoUrl.lazyCompilation).toEqual({
      imports: true,
      entries: false,
    });
    expect(
      matchPlugin(byName.nodeAutoUrl, 'HotModuleReplacementPlugin'),
    ).toBeTruthy();
    expect(byName.web.lazyCompilation).toEqual({
      imports: true,
      entries: false,
      serverUrl: 'http://localhost:3000',
    });
    expect(byName.web.lazyCompilation).not.toHaveProperty('node');
  });

  it.each([
    { action: 'dev', mode: 'development', enabled: true },
    { action: 'build', mode: 'development', enabled: false },
    { action: 'build', mode: 'production', enabled: false },
  ] as const)(
    'should align Node lazy compilation and HMR for $action in $mode mode',
    async ({ action, mode, enabled }) => {
      const rsbuild = await createRsbuild({
        config: {
          mode,
          output: { target: 'node' },
          dev: { lazyCompilation: { node: true } },
        },
      });
      const [config] = await rsbuild.initConfigs({ action });
      expect(Boolean(config.lazyCompilation)).toBe(enabled);
      expect(Boolean(matchPlugin(config, 'HotModuleReplacementPlugin'))).toBe(
        enabled,
      );
    },
  );

  it.each(['production', 'none'] as const)(
    'should reject Node lazy compilation in %s mode',
    async (mode) => {
      const rsbuild = await createRsbuild({
        config: {
          mode,
          output: { target: 'node' },
          dev: { lazyCompilation: { node: true } },
        },
      });
      await expect(rsbuild.initConfigs({ action: 'dev' })).rejects.toThrow(
        'Node lazy compilation requires mode: "development"',
      );
    },
  );

  it.each([
    {
      dev: {
        hmr: false,
        lazyCompilation: {
          node: true,
          serverUrl: 'http://localhost:3000',
        },
      },
      error: 'Node lazy compilation requires dev.hmr',
    },
    {
      dev: {
        lazyCompilation: {
          node: true,
          entries: true,
          serverUrl: 'http://localhost:3000',
        },
      },
      error:
        'Node lazy compilation does not support dev.lazyCompilation.entries: true',
    },
  ])(
    'should reject incompatible Node lazy compilation config',
    async ({ dev, error }) => {
      rs.stubEnv('NODE_ENV', 'development');
      const rsbuild = await createRsbuild({
        config: {
          output: { target: 'node' },
          dev,
        },
      });

      await expect(rsbuild.initConfigs({ action: 'dev' })).rejects.toThrow(
        error,
      );
    },
  );

  it.each([
    '/lazy',
    '//localhost:3000',
    '',
    'ftp://localhost:3000',
    'http://',
    'http:localhost',
  ])(
    'should reject invalid Node lazy compilation URL %j',
    async (serverUrl) => {
      rs.stubEnv('NODE_ENV', 'development');
      const rsbuild = await createRsbuild({
        config: {
          output: { target: 'node' },
          dev: { lazyCompilation: { node: true, serverUrl } },
        },
      });
      await expect(rsbuild.initConfigs({ action: 'dev' })).rejects.toThrow(
        'dev.lazyCompilation.serverUrl to be an absolute HTTP(S) URL',
      );
    },
  );

  it.each([
    { serverUrl: 'http://localhost:3000', expected: 'http://localhost:3000' },
    {
      serverUrl: 'https://example.com:443',
      expected: 'https://example.com:443',
    },
    {
      serverUrl: 'http://localhost:<port>',
      expected: 'http://localhost:<port>',
    },
    {
      serverUrl: 'HTTPS://example.com:443',
      expected: 'https://example.com:443',
    },
    {
      serverUrl: 'hTtPs://Example.com:<port>/Lazy',
      expected: 'https://Example.com:<port>/Lazy',
    },
  ])(
    'should preserve explicit Node lazy compilation URL %j during config inspection',
    async ({ serverUrl, expected }) => {
      rs.stubEnv('NODE_ENV', 'development');
      const rsbuild = await createRsbuild({
        config: {
          output: { target: 'node' },
          dev: { lazyCompilation: { node: true, serverUrl } },
        },
      });
      const [config] = await rsbuild.initConfigs({ action: 'dev' });
      expect(config.lazyCompilation).toMatchObject({ serverUrl: expected });
    },
  );

  it('should expose APIs by environment', async () => {
    const logs: string[] = [];
    const createConsumerPlugin = (name: string): RsbuildPlugin => ({
      name: `${name}-consumer`,
      setup(api) {
        logs.push(`${name}: ${api.useExposed('test-api')}`);
      },
    });

    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          {
            name: 'global-provider',
            setup(api) {
              api.expose('test-api', 'global');
            },
          },
          createConsumerPlugin('global'),
        ],
        environments: {
          web: {
            plugins: [
              {
                name: 'web-provider',
                setup(api) {
                  api.expose('test-api', 'web', { environment: 'web' });
                },
              },
              createConsumerPlugin('web'),
            ],
          },
          node: {
            plugins: [createConsumerPlugin('node')],
          },
        },
      },
    });

    await rsbuild.initConfigs();

    expect(logs).toEqual(['global: global', 'web: web', 'node: global']);
  });
});
