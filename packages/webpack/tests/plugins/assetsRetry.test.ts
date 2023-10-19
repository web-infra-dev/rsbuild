import { expect, describe, it } from 'vitest';
import { pluginAssetsRetry } from '@rsbuild/core/plugins/assetsRetry';
import { createStubBuilder } from '../helper';

describe('plugins/assetsRetry', () => {
  it('should add assets retry plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginAssetsRetry()],
      builderConfig: {
        output: {
          assetsRetry: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it("should't add assets retry plugin when target is set to 'node'", async () => {
    const builder = await createStubBuilder({
      plugins: [pluginAssetsRetry()],
      target: 'node',
      builderConfig: {
        output: {},
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
