import type { RsbuildConfig, RsbuildPluginAPI } from '@rsbuild/core';
import { createStubRsbuild } from './helper';

describe('modifyRsbuildConfig', () => {
  it.skip('should not allow to modify Rsbuild config', async () => {
    const rsbuild = await createStubRsbuild({});
    let config: RsbuildConfig;

    rsbuild.addPlugins([
      {
        name: 'foo',
        setup(api: RsbuildPluginAPI) {
          api.modifyRsbuildConfig((_config) => {
            config = _config;
            config.server = { port: 8080 };
          });

          api.modifyWebpackChain(() => {
            config.server ||= {};
            config.server.port = 8899;
          });
        },
      },
    ]);

    const {
      origin: { rsbuildConfig },
    } = await rsbuild.inspectConfig();

    expect(rsbuildConfig.server?.port).toBe(8080);
  });

  it('should modify config by utils', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        source: {
          entry: {
            main: 'src/index.ts',
          },
          preEntry: 'a.js',
        },
      },
    });

    rsbuild.addPlugins([
      {
        name: 'foo',
        setup(api: RsbuildPluginAPI) {
          api.modifyRsbuildConfig((config, utils) => {
            return utils.mergeRsbuildConfig(config, {
              output: {
                charset: 'ascii',
              },
              source: {
                preEntry: ['b.js'],
              },
            });
          });
        },
      },
    ]);

    const config = await rsbuild.unwrapConfig();
    expect(config.entry).toEqual({
      main: ['a.js', 'b.js', 'src/index.ts'],
    });
  });
});
