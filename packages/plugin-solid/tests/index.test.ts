import { createStubRsbuild } from '@scripts/test-helper';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '../src';
import type { RsbuildConfig } from '@rsbuild/core';

describe('plugin-solid', () => {
  const rsbuildConfig: RsbuildConfig = {
    performance: {
      buildCache: false,
    },
  };

  it('should apply solid preset correctly in rspack mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig,
      plugins: [pluginSolid(), pluginBabel()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should apply solid preset correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig,
      plugins: [pluginSolid(), pluginBabel()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure solid preset options', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig,
      plugins: [
        pluginSolid({
          solidPresetOptions: {
            generate: 'ssr',
            hydratable: true,
          },
        }),
        pluginBabel(),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
