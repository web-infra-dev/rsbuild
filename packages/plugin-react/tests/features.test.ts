import { createStubRsbuild } from '@scripts/test-helper';
import { pluginReact } from '../src';

describe('splitChunks', () => {
  it('should apply antd/semi/... splitChunks rule when pkg is installed', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        performance: {},
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.unwrapConfig();

    expect(config.optimization.splitChunks).toMatchSnapshot();
  });

  it('should not apply splitChunks rule when strategy is not split-by-experience', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'single-vendor',
          },
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.unwrapConfig();

    expect(config.optimization.splitChunks).toMatchSnapshot();
  });

  it('should apply splitChunks.react/router plugin option when strategy is split-by-experience', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'split-by-experience',
          },
        },
      },
    });

    rsbuild.addPlugins([
      pluginReact({
        splitChunks: {
          react: false,
          router: false,
        },
      }),
    ]);

    const config = await rsbuild.unwrapConfig();

    expect(config.optimization.splitChunks).toMatchSnapshot();
  });
});
