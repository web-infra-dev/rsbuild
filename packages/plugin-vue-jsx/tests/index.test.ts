import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginVueJsx } from '../src';

describe('plugin-vue-jsx', () => {
  it('should apply jsx babel plugin correctly in rspack mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [
        pluginVueJsx(),
        pluginBabel({
          include: /\.(?:jsx|tsx)$/,
          exclude: /[\\/]node_modules[\\/]/,
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should apply jsx babel plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [
        pluginVueJsx(),
        pluginBabel({
          include: /\.(?:jsx|tsx)$/,
          exclude: /[\\/]node_modules[\\/]/,
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [
        pluginVueJsx({
          vueJsxOptions: {
            transformOn: false,
          },
        }),
        pluginBabel({
          include: /\.(?:jsx|tsx)$/,
          exclude: /[\\/]node_modules[\\/]/,
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
