import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginToml } from '../src';

describe('plugin-toml', () => {
  it('should add toml rule properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginToml()],
      rsbuildConfig: {},
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
