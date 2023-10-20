import { expect, describe, it } from 'vitest';
import { pluginAssetsRetry } from '@rsbuild/core/plugins/assetsRetry';
import { createStubRsbuild } from '../helper';

describe('plugins/assetsRetry', () => {
  it('should add assets retry plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAssetsRetry()],
      rsbuildConfig: {
        output: {
          assetsRetry: {},
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it("should't add assets retry plugin when target is set to 'node'", async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginAssetsRetry()],
      target: 'node',
      rsbuildConfig: {
        output: {},
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
