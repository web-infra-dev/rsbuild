import type { DeepReadonly } from '@rsbuild/shared';
import type { DevConfig, NormalizedDevConfig } from './dev';
import type {
  ExperimentsConfig,
  NormalizedExperimentsConfig,
} from './experiments';
import type { HtmlConfig, NormalizedHtmlConfig } from './html';
import type { NormalizedOutputConfig, OutputConfig } from './output';
import type {
  NormalizedPerformanceConfig,
  PerformanceConfig,
} from './performance';
import type { NormalizedSecurityConfig, SecurityConfig } from './security';
import type { NormalizedSourceConfig, SourceConfig } from './source';
import type { NormalizedToolsConfig, ToolsConfig } from './tools';

/** The Rsbuild config when using Webpack as the bundler */
export interface RsbuildConfig {
  dev?: DevConfig;
  html?: HtmlConfig;
  tools?: ToolsConfig;
  source?: SourceConfig;
  output?: OutputConfig;
  security?: SecurityConfig;
  performance?: PerformanceConfig;
  experiments?: ExperimentsConfig;
}

export type NormalizedConfig = DeepReadonly<{
  dev: NormalizedDevConfig;
  html: NormalizedHtmlConfig;
  tools: NormalizedToolsConfig;
  source: NormalizedSourceConfig;
  output: NormalizedOutputConfig;
  security: NormalizedSecurityConfig;
  performance: NormalizedPerformanceConfig;
  experiments: NormalizedExperimentsConfig;
}>;

export * from './dev';
export * from './experiments';
export * from './html';
export * from './output';
export * from './performance';
export * from './security';
export * from './source';
export * from './tools';
