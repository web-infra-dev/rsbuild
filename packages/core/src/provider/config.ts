import {
  mergeRsbuildConfig,
  getDefaultDevConfig,
  getDefaultServerConfig,
  getDefaultHtmlConfig,
  getDefaultToolsConfig,
  getDefaultOutputConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
  type RsbuildConfig,
  type NormalizedConfig,
} from '@rsbuild/shared';

export const createDefaultConfig = (): RsbuildConfig => ({
  dev: getDefaultDevConfig(),
  server: getDefaultServerConfig(),
  html: getDefaultHtmlConfig(),
  source: getDefaultSourceConfig(),
  output: getDefaultOutputConfig(),
  tools: getDefaultToolsConfig(),
  security: getDefaultSecurityConfig(),
  performance: getDefaultPerformanceConfig(),
});

export const withDefaultConfig = (config: RsbuildConfig) =>
  mergeRsbuildConfig<RsbuildConfig>(createDefaultConfig(), config);

/** #__PURE__
 * 1. May used by multiple plugins.
 * 2. Object value that should not be empty.
 * 3. Meaningful and can be filled by constant value.
 */
export const normalizeConfig = (config: RsbuildConfig): NormalizedConfig =>
  mergeRsbuildConfig<NormalizedConfig>(
    createDefaultConfig() as NormalizedConfig,
    config as NormalizedConfig,
  );
