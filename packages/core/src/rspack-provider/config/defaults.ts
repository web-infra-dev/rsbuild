import {
  mergeRsbuildConfig,
  getDefaultDevConfig,
  getDefaultHtmlConfig,
  getDefaultToolsConfig,
  getDefaultOutputConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
} from '@rsbuild/shared';
import type { RsbuildConfig } from '../../types';

export const createDefaultConfig = (): RsbuildConfig => ({
  dev: getDefaultDevConfig(),
  html: getDefaultHtmlConfig(),
  source: getDefaultSourceConfig(),
  output: getDefaultOutputConfig(),
  tools: getDefaultToolsConfig(),
  security: getDefaultSecurityConfig(),
  performance: getDefaultPerformanceConfig(),
});

export const withDefaultConfig = (config: RsbuildConfig) =>
  mergeRsbuildConfig<RsbuildConfig>(createDefaultConfig(), config);
