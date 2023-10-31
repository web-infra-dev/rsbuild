import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginSvelte } from '../src';

describe('plugin-svelte', () => {
  it('should add svelte loader properly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginSvelte()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set dev and hotReload to false in production mode', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginSvelte()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should turn off hmr by hand correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        dev: {
          hmr: false,
        },
      },
      plugins: [pluginSvelte()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
