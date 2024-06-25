import { isProd } from '../helpers';
import type {
  NormalizedEnvironmentConfig,
  RsbuildConfig,
  RsbuildPlugin,
} from '../types';

// There are two ways to enable the bundle analyzer:
// 1. Set environment variable `BUNDLE_ANALYZE`
// 2. Set performance.bundleAnalyze config
const isUseAnalyzer = (config: RsbuildConfig | NormalizedEnvironmentConfig) =>
  process.env.BUNDLE_ANALYZE || config.performance?.bundleAnalyze;

export function pluginBundleAnalyzer(): RsbuildPlugin {
  return {
    name: 'rsbuild:bundle-analyzer',

    setup(api) {
      api.modifyRsbuildConfig({
        order: 'post',
        handler: (config) => {
          if (isProd()) {
            return;
          }

          const useAnalyzer =
            isUseAnalyzer(config) ||
            Object.values(config.environments || []).some((config) =>
              isUseAnalyzer(config),
            );

          if (!useAnalyzer) {
            return;
          }

          // webpack-bundle-analyze needs to read assets from disk
          config.dev ||= {};
          config.dev.writeToDisk = true;

          return config;
        },
      });

      api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
        const config = api.getNormalizedConfig({ environment });

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
              reportFilename: `report-${environment}.html`,
              ...(config.performance.bundleAnalyze || {}),
            },
          ]);
      });
    },
  };
}
