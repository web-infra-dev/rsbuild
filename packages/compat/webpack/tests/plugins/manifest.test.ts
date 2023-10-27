import { pluginManifest } from '@/plugins/manifest';
import { createStubRsbuild } from '../helper';

describe('plugin-manifest', () => {
  it('should not register manifest plugin by default', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginManifest()],
    });

    expect(
      await rsbuild.matchWebpackPlugin('WebpackManifestPlugin'),
    ).toBeFalsy();
  });

  it('should register manifest plugin when output.enableAssetManifest is enabled', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginManifest()],
      rsbuildConfig: {
        output: {
          enableAssetManifest: true,
        },
      },
    });

    expect(
      await rsbuild.matchWebpackPlugin('WebpackManifestPlugin'),
    ).toBeTruthy();
  });
});
