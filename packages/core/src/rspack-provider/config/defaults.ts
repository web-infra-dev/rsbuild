import {
  mergeBuilderConfig,
  getDefaultDevConfig,
  getDefaultHtmlConfig,
  getDefaultToolsConfig,
  getDefaultOutputConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
} from '@rsbuild/shared';
import type { BuilderConfig } from '../types';

export const createDefaultConfig = (): BuilderConfig => ({
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

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig<BuilderConfig>(createDefaultConfig(), config);
