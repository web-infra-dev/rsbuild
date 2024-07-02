import { createStubRsbuild } from '@scripts/test-helper';
import { PLUGIN_VUE2_NAME, pluginVue2 } from '../src';

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

  it('should include polyfill resolve config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginVue2({
          vueLoaderOptions: {
            hotReload: false,
          },
        }),
        {
          name: 'fake-swc-plugin',
          post: [PLUGIN_VUE2_NAME],
          setup(api) {
            api.modifyBundlerChain((chain, { CHAIN_ID }) => {
              const fakeJSRule = chain.module.rule(CHAIN_ID.RULE.JS);
              fakeJSRule.test(/\.js$/);
              fakeJSRule.resolve.alias.set('core-js', 'core-js-aaa');
              fakeJSRule.resolve.fullySpecified(false);
            });
          },
        },
      ],
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
