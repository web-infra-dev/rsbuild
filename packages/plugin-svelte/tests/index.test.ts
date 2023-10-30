import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginSvelte } from '../src';

describe('plugin-svelte', () => {
  it('should add svelte loader properly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginSvelte()],
    });
    const { bundlerConfigs } = await rsbuild.inspectConfig();

    expect(bundlerConfigs).toMatchSnapshot();
  });

  it('should set dev and hotReload to false in production mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginSvelte()],
    });
    const { bundlerConfigs } = await rsbuild.inspectConfig({
      env: 'production',
    });

    expect(bundlerConfigs).toMatchSnapshot();
  });
});
