import type { EnvironmentConfig } from '@rsbuild/shared';
import type { RsbuildConfig, RsbuildPlugin } from '../types';

/**
 * Apply some configs of Rsbuild performance
 */
export const pluginPerformance = (): RsbuildPlugin => ({
  name: 'rsbuild:performance',

  setup(api) {
    api.modifyRsbuildConfig({
      order: 'post',
      handler: (rsbuildConfig) => {
        // profile needs to be output to stats.json
        const applyBundleAnalyzeConfig = (
          config: RsbuildConfig | EnvironmentConfig,
        ) => {
          if (!config.performance?.bundleAnalyze) {
            config.performance ??= {};
            config.performance.bundleAnalyze = {
              analyzerMode: 'disabled',
              generateStatsFile: true,
            };
          } else {
            config.performance.bundleAnalyze = {
              generateStatsFile: true,
              ...(config.performance.bundleAnalyze || {}),
            };
          }
        };
        if (rsbuildConfig.performance?.profile) {
          applyBundleAnalyzeConfig(rsbuildConfig);
        } else if (rsbuildConfig.environments) {
          for (const config of Object.values(rsbuildConfig.environments)) {
            if (config.performance?.profile) {
              applyBundleAnalyzeConfig(config);
            }
          }
        }
      },
    });

    api.modifyBundlerChain((chain, { environment }) => {
      const { config } = environment;
      const { profile } = config.performance;
      if (!profile) {
        return;
      }

      chain.profile(profile);
    });
  },
});
