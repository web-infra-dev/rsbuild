import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/webpack/stub';
import { pluginBabel } from '@rsbuild/webpack/plugins/babel';
import { pluginDefine } from '@modern-js/builder/plugins/define';
import { pluginVue } from '../src';

describe('plugins/vue', () => {
  it('should add vue-loader and VueLoaderPlugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue()],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure vueLoader options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginVue({
          vueLoaderOptions: {
            hotReload: false,
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should apply jsx babel plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue(), pluginBabel()],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginVue({
          vueJsxOptions: {
            transformOn: false,
          },
        }),
        pluginBabel(),
      ],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should define feature flags correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue(), pluginDefine()],
    });
    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
