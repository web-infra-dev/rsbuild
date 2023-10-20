import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginBabel } from '@rsbuild/webpack/plugins/babel';
import { pluginVue2 } from '../src';

describe('plugins/vue', () => {
  it('should add vue-loader and VueLoaderPlugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue2()],
      provider: webpackProvider,
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
      provider: webpackProvider,
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should apply jsx babel plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue2(), pluginBabel()],
      provider: webpackProvider,
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginVue2({
          vueJsxOptions: {
            injectH: false,
          },
        }),
        pluginBabel(),
      ],
      provider: webpackProvider,
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
