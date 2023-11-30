import {
  mergeRsbuildConfig,
  getDefaultServerConfig,
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
  server: getDefaultServerConfig(),
  html: getDefaultHtmlConfig(),
  tools: getDefaultToolsConfig(),
  source: getDefaultSourceConfig(),
  output: getDefaultOutputConfig(),
  security: getDefaultSecurityConfig(),
  performance: getDefaultPerformanceConfig(),
});

export const withDefaultConfig = (config: RsbuildConfig) =>
  mergeRsbuildConfig<RsbuildConfig>(createDefaultConfig(), config);
