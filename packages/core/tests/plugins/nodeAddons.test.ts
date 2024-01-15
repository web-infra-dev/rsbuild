import { createStubRsbuild } from '@scripts/test-helper';
import { pluginNodeAddons } from '@src/plugins/nodeAddons';

describe('plugin-node-addons', () => {
  it('should add node addons rule properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNodeAddons()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not add node addons rule when target is web', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNodeAddons()],
      rsbuildConfig: {
        output: {
          targets: ['web'],
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config.module).toBeUndefined();
  });

  it('should not add node addons rule when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNodeAddons()],
      rsbuildConfig: {
        output: {
          targets: ['web-worker'],
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config.module).toBeUndefined();
  });

  it('should not add node addons rule when target is service-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNodeAddons()],
      rsbuildConfig: {
        output: {
          targets: ['service-worker'],
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config.module).toBeUndefined();
  });
});
