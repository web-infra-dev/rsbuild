import type { DevConfig, NormalizedDevConfig } from './dev';
import type { ServerConfig, NormalizedServerConfig } from './server';
import type { HtmlConfig, NormalizedHtmlConfig } from './html';
import type { OutputConfig, NormalizedOutputConfig } from './output';
import type { SourceConfig, NormalizedSourceConfig } from './source';
import type { SecurityConfig, NormalizedSecurityConfig } from './security';
import type {
  PerformanceConfig,
  NormalizedPerformanceConfig,
} from './performance';
import type { ToolsConfig, NormalizedToolsConfig } from './tools';
import type { DeepReadonly } from '../utils';
import type { RsbuildPlugin } from '..';

/**
 * The shared Rsbuild config.
 * Can be used with both Rspack and Webpack.
 * */
export interface RsbuildConfig {
  dev?: DevConfig;
  server?: ServerConfig;
  html?: HtmlConfig;
  tools?: ToolsConfig;
  source?: SourceConfig;
  output?: OutputConfig;
  security?: SecurityConfig;
  performance?: PerformanceConfig;
  plugins?: RsbuildPlugin[];
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
  plugins?: RsbuildPlugin[];
}>;

export * from './dev';
export * from './server';
export * from './html';
export * from './output';
export * from './source';
export * from './security';
export * from './performance';
export * from './tools';
