import { createRsbuild } from '@rsbuild/core';
import { createStubRsbuild } from '@scripts/test-helper';
import { matchPlugin } from '@scripts/test-helper';
import { pluginVue } from '../src';

describe('plugin-vue', () => {
  it('should add vue-loader and VueLoaderPlugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginVue()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure vueLoader options', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [
        pluginVue({
          vueLoaderOptions: {
            hotReload: false,
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should define feature flags correctly', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginVue()],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(matchPlugin(config[0], 'DefinePlugin')).toMatchSnapshot();
  });
});
