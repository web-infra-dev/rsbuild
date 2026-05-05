import { createRsbuild, type RsbuildConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { matchRules } from '@scripts/test-helper';
import { pluginSolid } from '../src';

describe('plugin-solid', () => {
  const rsbuildConfig: RsbuildConfig = {
    performance: {
      buildCache: false,
    },
  };

  it('should apply solid preset correctly', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid(), pluginBabel()],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(matchRules(config[0], 'a.tsx')[0]).toMatchSnapshot();
  });

  it('should add solid resolve condition', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid()],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(config[0].resolve?.conditionNames).toEqual(['solid', '...']);
  });

  it('should preserve user resolve condition names', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        resolve: {
          conditionNames: ['custom', 'import'],
        },
        plugins: [pluginSolid()],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(config[0].resolve?.conditionNames).toEqual([
      'solid',
      'custom',
      'import',
    ]);
  });

  it('should allow disabling solid refresh', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid({ hot: false }), pluginBabel()],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(
      JSON.stringify(matchRules(config[0], 'a.tsx')[0]).includes(
        'solid-refresh',
      ),
    ).toEqual(false);
    expect(config[0].resolve?.alias?.['solid-refresh']).toEqual(undefined);
  });

  it('should allow to configure solid preset options', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [
          pluginSolid({
            solidPresetOptions: {
              generate: 'ssr',
              hydratable: true,
            },
          }),
          pluginBabel(),
        ],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(matchRules(config[0], 'a.tsx')[0]).toMatchSnapshot();
  });
});
