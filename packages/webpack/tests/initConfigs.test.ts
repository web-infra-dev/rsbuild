import type { RsbuildPluginAPI } from '@rsbuild/core';
import { createStubRsbuild } from './helper';

describe('modifyRsbuildConfig', () => {
  it('should modify config by utils', async () => {
    const rsbuild = await createStubRsbuild({
      config: {
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
