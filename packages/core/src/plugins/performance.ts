import type { BundlerChain, NormalizedConfig } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

function applyProfile({
  chain,
  config,
}: {
  chain: BundlerChain;
  config: NormalizedConfig;
}) {
  const { profile } = config.performance;
  if (!profile) {
    return;
  }

  chain.profile(profile);
}

/**
 * Apply some configs of Rsbuild performance
 */
export const pluginPerformance = (): RsbuildPlugin => ({
  name: 'plugin-performance',

  setup(api) {
    api.modifyRsbuildConfig((rsbuildConfig) => {
      if (rsbuildConfig.performance?.profile) {
        // generate stats.json
        if (!rsbuildConfig.performance?.bundleAnalyze) {
          rsbuildConfig.performance ??= {};
          rsbuildConfig.performance.bundleAnalyze = {
            analyzerMode: 'disabled',
            generateStatsFile: true,
          };
        } else {
          rsbuildConfig.performance.bundleAnalyze = {
            generateStatsFile: true,
            ...(rsbuildConfig.performance.bundleAnalyze || {}),
          };
        }
      }
    });
    api.modifyBundlerChain((chain) => {
      const config = api.getNormalizedConfig();

      applyProfile({ chain, config });
    });
  },
});
