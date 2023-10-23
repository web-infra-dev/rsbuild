import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginDefine } from '@rsbuild/core/plugins/define';
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
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue(), pluginDefine()],
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });
});
