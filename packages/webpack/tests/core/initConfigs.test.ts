import { describe, expect, it } from 'vitest';
import { createStubRsbuild } from '../helper';
import { RsbuildConfig, RsbuildPluginAPI } from '@/types';

describe('modifyRsbuildConfig', () => {
  it.skip('should not allow to modify Rsbuild config', async () => {
    const rsbuild = await createStubRsbuild({});
    let config: RsbuildConfig;

    rsbuild.addPlugins([
      {
        name: 'foo',
        setup(api: RsbuildPluginAPI) {
          api.modifyRsbuildConfig((_config, utils) => {
            config = _config;
            config.dev = { port: 8080 };
          });

          api.modifyWebpackChain(() => {
            config.dev!.port = 8899;
          });
        },
      },
    ]);

    const {
      origin: { rsbuildConfig },
    } = await rsbuild.inspectConfig();

    expect(rsbuildConfig.dev.port).toBe(8080);
  });

  it('should modify config by utils', async () => {
    const rsbuild = await createStubRsbuild({
      entry: {
        main: 'src/index.ts',
      },
      rsbuildConfig: {
        source: {
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

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.entry).toEqual({
      main: [
        'data:text/javascript,import "core-js";',
        'a.js',
        'b.js',
        'src/index.ts',
      ],
    });
  });
});
