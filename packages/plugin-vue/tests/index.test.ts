import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/vitest-helper';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginBabel } from '@rsbuild/webpack/plugins/babel';
import { pluginDefine } from '@rsbuild/core/plugins/define';
import { pluginVue } from '../src';

describe('plugins/vue', () => {
  it('should add vue-loader and VueLoaderPlugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      provider: webpackProvider,
      rsbuildConfig: {},
      plugins: [pluginVue()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure vueLoader options', async () => {
    const rsbuild = await createStubRsbuild({
      provider: webpackProvider,
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

  it('should apply jsx babel plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      provider: webpackProvider,
      rsbuildConfig: {},
      plugins: [pluginVue(), pluginBabel()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      provider: webpackProvider,
      rsbuildConfig: {},
      plugins: [
        pluginVue({
          vueJsxOptions: {
            transformOn: false,
          },
        }),
        pluginBabel(),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should define feature flags correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue(), pluginDefine()],
      provider: webpackProvider,
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });
});
