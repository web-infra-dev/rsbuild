import { createStubRsbuild } from '@scripts/test-helper';
import { pluginBundleAnalyzer } from '../src/plugins/bundleAnalyzer';
import { pluginPerformance } from '../src/plugins/performance';

describe('plugin-bundle-analyze', () => {
  it('should add bundle analyze plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBundleAnalyzer()],
      config: {
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

  it('should add bundle analyze plugin when bundle analyze is enabled in environments', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBundleAnalyzer()],
      config: {
        environments: {
          web: {
            performance: {
              bundleAnalyze: {
                reportFilename: 'index$$.html',
              },
            },
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should enable bundle analyze plugin when performance.profile is enable', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginPerformance(), pluginBundleAnalyzer()],
      config: {
        environments: {
          web: {
            performance: {
              profile: true,
            },
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
