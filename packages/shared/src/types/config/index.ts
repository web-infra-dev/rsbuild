import type { SharedDevConfig, NormalizedSharedDevConfig } from './dev';
import type { SharedHtmlConfig, NormalizedSharedHtmlConfig } from './html';
import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
} from './output';
import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
} from './source';
import type {
  SharedSecurityConfig,
  NormalizedSharedSecurityConfig,
} from './security';
import type {
  SharedPerformanceConfig,
  NormalizedSharedPerformanceConfig,
} from './performance';
import type { SharedExperimentsConfig } from './experiments';
import type { SharedToolsConfig } from './tools';
import type { DeepReadonly } from '../utils';

/**
 * The shared Rsbuild config.
 * Can be used with both Rspack and Webpack.
 * */
export interface SharedRsbuildConfig {
  dev?: SharedDevConfig;
  html?: SharedHtmlConfig;
  tools?: SharedToolsConfig;
  source?: SharedSourceConfig;
  output?: SharedOutputConfig;
  security?: SharedSecurityConfig;
  performance?: SharedPerformanceConfig;
  experiments?: SharedExperimentsConfig;
}

export type SharedNormalizedConfig = DeepReadonly<{
  dev: NormalizedSharedDevConfig;
  html: NormalizedSharedHtmlConfig;
  tools: SharedToolsConfig;
  source: NormalizedSharedSourceConfig;
  output: NormalizedSharedOutputConfig;
  security: NormalizedSharedSecurityConfig;
  performance: NormalizedSharedPerformanceConfig;
}>;

export * from './dev';
export * from './html';
export * from './output';
export * from './source';
export * from './security';
export * from './performance';
export * from './experiments';
export * from './tools';
