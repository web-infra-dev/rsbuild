import {
  mergeRsbuildConfig,
  getDefaultDevConfig,
  getDefaultOutputConfig,
  getDefaultHtmlConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
  getDefaultToolsConfig,
} from '@rsbuild/shared';
import type { RsbuildConfig } from '../types';

export const createDefaultConfig = (): RsbuildConfig => ({
  dev: getDefaultDevConfig(),
  html: getDefaultHtmlConfig(),
  tools: {
    ...getDefaultToolsConfig(),
    cssExtract: {
      loaderOptions: {},
      pluginOptions: {},
    },
  },
  source: getDefaultSourceConfig(),
  output: getDefaultOutputConfig(),
  security: getDefaultSecurityConfig(),
  experiments: {
    lazyCompilation: false,
  },
  performance: getDefaultPerformanceConfig(),
});

export const withDefaultConfig = (config: RsbuildConfig) =>
  mergeRsbuildConfig<RsbuildConfig>(createDefaultConfig(), config);
