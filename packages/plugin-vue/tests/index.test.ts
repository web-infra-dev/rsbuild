import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@rsbuild/webpack/stub';
import { pluginBabel } from '@rsbuild/webpack/plugins/babel';
import { pluginDefine } from '@modern-js/builder/plugins/define';
import { pluginVue } from '../src';

describe('plugins/vue', () => {
  it('should add vue-loader and VueLoaderPlugin correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginVue()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure vueLoader options', async () => {
    const builder = await createStubBuilder({
      plugins: [
        pluginVue({
          vueLoaderOptions: {
            hotReload: false,
          },
        }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should apply jsx babel plugin correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginVue(), pluginBabel()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const builder = await createStubBuilder({
      plugins: [
        pluginVue({
          vueJsxOptions: {
            transformOn: false,
          },
        }),
        pluginBabel(),
      ],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should define feature flags correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginVue(), pluginDefine()],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
