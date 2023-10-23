import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginNodeAddons } from '@src/plugins/nodeAddons';

describe('plugin-node-addons', () => {
  it('should add node addons rule properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNodeAddons()],
      rsbuildConfig: {},
      target: 'node',
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
