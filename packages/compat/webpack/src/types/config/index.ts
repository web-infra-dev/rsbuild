import type { DeepReadonly } from '@rsbuild/shared';
import type { NormalizedToolsConfig, ToolsConfig } from './tools';

import type {
  DevConfig,
  ServerConfig,
  HtmlConfig,
  SourceConfig,
  OutputConfig,
  SecurityConfig,
  PerformanceConfig,
  NormalizedDevConfig,
  NormalizedServerConfig,
  NormalizedHtmlConfig,
  NormalizedSourceConfig,
  NormalizedOutputConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
} from '@rsbuild/shared';

export type {
  DevConfig,
  HtmlConfig,
  SourceConfig,
  OutputConfig,
  SecurityConfig,
  PerformanceConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedSourceConfig,
  NormalizedOutputConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
};

export * from './tools';

/** The Rsbuild config when using Webpack as the bundler */
export interface RsbuildConfig {
  dev?: DevConfig;
  server?: ServerConfig;
  html?: HtmlConfig;
  tools?: ToolsConfig;
  source?: SourceConfig;
  output?: OutputConfig;
  security?: SecurityConfig;
  performance?: PerformanceConfig;
}

export type NormalizedConfig = DeepReadonly<{
  dev: NormalizedDevConfig;
  server: NormalizedServerConfig;
  html: NormalizedHtmlConfig;
  tools: NormalizedToolsConfig;
  source: NormalizedSourceConfig;
  output: NormalizedOutputConfig;
  security: NormalizedSecurityConfig;
  performance: NormalizedPerformanceConfig;
}>;
