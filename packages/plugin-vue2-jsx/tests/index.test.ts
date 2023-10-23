import { createStubRsbuild } from '@rsbuild/test-helper';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginBabel } from '@rsbuild/webpack/plugin-babel';
import { pluginVue2Jsx } from '../src';

describe('plugin-vue2-jsx', () => {
  it('should apply jsx babel plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue2Jsx(), pluginBabel()],
      provider: webpackProvider,
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginVue2Jsx({
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
