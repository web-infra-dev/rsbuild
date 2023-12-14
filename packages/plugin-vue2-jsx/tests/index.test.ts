import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginVue2Jsx } from '../src';

describe('plugin-vue2-jsx', () => {
  it('should apply jsx babel plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginVue2Jsx(), pluginBabel()],
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
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
