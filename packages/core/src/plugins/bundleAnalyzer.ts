import { isProd } from '@rsbuild/shared';
import type { RsbuildConfig, RsbuildPlugin, NormalizedConfig } from '../types';

// There are two ways to enable the bundle analyzer:
// 1. Set environment variable `BUNDLE_ANALYZE`
// 2. Set performance.bundleAnalyze config
const isUseAnalyzer = (config: RsbuildConfig | NormalizedConfig) =>
  process.env.BUNDLE_ANALYZE || config.performance?.bundleAnalyze;

export function pluginBundleAnalyzer(): RsbuildPlugin {
  return {
    name: 'rsbuild:bundle-analyzer',

    setup(api) {
      api.modifyRsbuildConfig((config) => {
        if (isProd() || !isUseAnalyzer(config)) {
          return;
        }

        // webpack-bundle-analyze needs to read assets from disk
        config.dev ||= {};
        config.dev.writeToDisk = true;

        return config;
      });

      api.modifyBundlerChain(async (chain, { CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();

        if (!isUseAnalyzer(config)) {
          return;
        }

        const { default: BundleAnalyzer } = await import(
          '@rsbuild/shared/webpack-bundle-analyzer'
        );

        chain
          .plugin(CHAIN_ID.PLUGIN.BUNDLE_ANALYZER)
          .use(BundleAnalyzer.BundleAnalyzerPlugin, [
            {
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: `report-${target}.html`,
              ...(config.performance.bundleAnalyze || {}),
            },
          ]);
      });
    },
  };
}
