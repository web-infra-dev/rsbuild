import { expect, describe, it } from 'vitest';
import { pluginManifest } from '@/plugins/manifest';
import { createStubBuilder } from '../helper';

describe('plugins/manifest', () => {
  it('should not register manifest plugin by default', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginManifest()],
    });

    expect(
      await builder.matchWebpackPlugin('WebpackManifestPlugin'),
    ).toBeFalsy();
  });

  it('should register manifest plugin when output.enableAssetManifest is enabled', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginManifest()],
      builderConfig: {
        output: {
          enableAssetManifest: true,
        },
      },
    });

    expect(
      await builder.matchWebpackPlugin('WebpackManifestPlugin'),
    ).toBeTruthy();
  });
});
