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
      await rsbuild.matchWebpackPlugin('WebpackManifestPlugin'),
    ).toBeTruthy();
  });
});
