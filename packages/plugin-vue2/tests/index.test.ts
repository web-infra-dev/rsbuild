import { createStubRsbuild } from '@scripts/test-helper';
import { pluginVue2 } from '../src';

describe('plugin-vue2', () => {
  it('should add vue-loader and VueLoaderPlugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue2()],
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure vueLoader options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginVue2({
          vueLoaderOptions: {
            hotReload: false,
          },
        }),
      ],
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
