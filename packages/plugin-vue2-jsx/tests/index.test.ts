import { createStubRsbuild } from '@scripts/test-helper';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginVue2Jsx } from '../src';
import type { RsbuildConfig } from '@rsbuild/core';

describe('plugin-vue2-jsx', () => {
  const rsbuildConfig: RsbuildConfig = {
    performance: {
      buildCache: false,
    },
  };

  it('should apply jsx babel plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue2Jsx(), pluginBabel()],
      rsbuildConfig,
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginVue2Jsx({
          vueJsxOptions: {
            injectH: false,
          },
        }),
        pluginBabel(),
      ],
      rsbuildConfig,
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
