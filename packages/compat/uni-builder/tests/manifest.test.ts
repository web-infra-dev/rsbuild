import { pluginManifest } from '../src/webpack/plugins/manifest';
import { createStubRsbuild } from '../../webpack/tests/helper';

describe('plugin-manifest', () => {
  it('should register manifest plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginManifest()],
      rsbuildConfig: {
        output: {
          enableAssetManifest: true,
        },
      },
    });

    expect(
      await rsbuild.matchBundlerPlugin('WebpackManifestPlugin'),
    ).toBeTruthy();
  });

  it('should register manifest plugin correctly when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginManifest()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
          enableAssetManifest: true,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });
});
