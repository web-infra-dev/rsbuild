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
import type { UniBuilderWebpackConfig } from '../types';

export const createDefaultConfig = (): UniBuilderWebpackConfig => ({
  dev: getDefaultDevConfig(),
  html: getDefaultHtmlConfig(),
  tools: {
    ...getDefaultToolsConfig(),
    cssExtract: {
      loaderOptions: {},
      pluginOptions: {},
    },
  },
  source: {
    ...getDefaultSourceConfig(),
    define: {},
  },
  output: getDefaultOutputConfig(),
  security: {
    ...getDefaultSecurityConfig(),
    sri: false,
  },
  experiments: {
    lazyCompilation: false,
    sourceBuild: false,
  },
  performance: getDefaultPerformanceConfig(),
});

export const withDefaultConfig = (config: UniBuilderWebpackConfig) =>
  mergeRsbuildConfig<UniBuilderWebpackConfig>(createDefaultConfig(), config);
