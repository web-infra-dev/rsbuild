import { createStubRsbuild } from '@rsbuild/test-helper';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginBabel } from '@rsbuild/webpack/plugin-babel';
import { pluginVueJsx } from '../src';

describe('plugin-vue-jsx', () => {
  it('should apply jsx babel plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      provider: webpackProvider,
      rsbuildConfig: {},
      plugins: [pluginVueJsx(), pluginBabel()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      provider: webpackProvider,
      rsbuildConfig: {},
      plugins: [
        pluginVueJsx({
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
});
