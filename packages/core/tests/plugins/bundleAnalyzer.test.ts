import { createStubRsbuild } from '@scripts/test-helper';
import { pluginBundleAnalyzer } from '@src/plugins/bundleAnalyzer';

describe('plugin-bundle-analyze', () => {
  it('should add bundle analyze plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBundleAnalyzer()],
      rsbuildConfig: {
        performance: {
          bundleAnalyze: {
            reportFilename: 'index$$.html',
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
