import {
  getDefaultDevConfig,
  getDefaultHtmlConfig,
  getDefaultToolsConfig,
  getDefaultOutputConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
} from '../shared/defaults';
import { mergeRsbuildConfig } from '@rsbuild/shared';
import type { UniBuilderRspackConfig } from '../types';

export const createDefaultConfig = (): UniBuilderRspackConfig => ({
  dev: getDefaultDevConfig(),
  html: getDefaultHtmlConfig(),
  source: {
    ...getDefaultSourceConfig(),
    define: {},
  },
  output: getDefaultOutputConfig(),
  tools: getDefaultToolsConfig(),
  security: getDefaultSecurityConfig(),
  performance: getDefaultPerformanceConfig(),
});

export const withDefaultConfig = (config: UniBuilderRspackConfig) =>
  mergeRsbuildConfig<UniBuilderRspackConfig>(createDefaultConfig(), config);
