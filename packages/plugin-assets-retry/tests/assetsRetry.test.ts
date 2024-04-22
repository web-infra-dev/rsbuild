import { createStubRsbuild } from '../../compat/webpack/tests/helper';
import { pluginAssetsRetry } from '../src';

describe('plugin-assets-retry', () => {
  it('should add assets retry plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAssetsRetry()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it("should't add assets retry plugin when target is set to 'node'", async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAssetsRetry()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
