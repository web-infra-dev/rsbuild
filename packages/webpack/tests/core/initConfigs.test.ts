import { describe, expect, it } from 'vitest';
import { createStubBuilder } from '../helper';
import { BuilderConfig, BuilderPluginAPI } from '@/types';

describe('modifyBuilderConfig', () => {
  it.skip('should not allow to modify builder config', async () => {
    const builder = await createStubBuilder({});
    let config: BuilderConfig;

    builder.addPlugins([
      {
        name: 'foo',
        setup(api: BuilderPluginAPI) {
          api.modifyBuilderConfig((_config, utils) => {
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
      origin: { builderConfig },
    } = await builder.inspectConfig();

    expect(builderConfig.dev.port).toBe(8080);
  });

  it('should modify config by utils', async () => {
    const builder = await createStubBuilder({
      entry: {
        main: 'src/index.ts',
      },
      builderConfig: {
        source: {
          preEntry: 'a.js',
        },
      },
    });

    builder.addPlugins([
      {
        name: 'foo',
        setup(api: BuilderPluginAPI) {
          api.modifyBuilderConfig((config, utils) => {
            return utils.mergeBuilderConfig(config, {
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

    const config = await builder.unwrapWebpackConfig();
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
