import type { DeepReadonly } from '@rsbuild/shared';
import type {
  SharedDevConfig,
  SharedHtmlConfig,
  SharedToolsConfig,
  SharedSourceConfig,
  SharedOutputConfig,
  SharedSecurityConfig,
  SharedPerformanceConfig,
  NormalizedSharedDevConfig,
  NormalizedSharedHtmlConfig,
  NormalizedSharedToolsConfig,
  NormalizedSharedSourceConfig,
  NormalizedSharedOutputConfig,
  NormalizedSharedSecurityConfig,
  NormalizedSharedPerformanceConfig,
} from '@rsbuild/shared';

export type DevConfig = SharedDevConfig;
export type HtmlConfig = SharedHtmlConfig;
export type ToolsConfig = SharedToolsConfig;
export type SourceConfig = SharedSourceConfig;
export type OutputConfig = SharedOutputConfig;
export type SecurityConfig = SharedSecurityConfig;
export type PerformanceConfig = SharedPerformanceConfig;
export type NormalizedDevConfig = NormalizedSharedDevConfig;
export type NormalizedHtmlConfig = NormalizedSharedHtmlConfig;
export type NormalizedToolsConfig = NormalizedSharedToolsConfig;
export type NormalizedSourceConfig = NormalizedSharedSourceConfig;
export type NormalizedOutputConfig = NormalizedSharedOutputConfig;
export type NormalizedSecurityConfig = NormalizedSharedSecurityConfig;
export type NormalizedPerformanceConfig = NormalizedSharedPerformanceConfig;

export interface RsbuildConfig {
  dev?: DevConfig;
  html?: HtmlConfig;
  tools?: ToolsConfig;
  source?: SourceConfig;
  output?: OutputConfig;
  security?: SecurityConfig;
  performance?: PerformanceConfig;
}

export type NormalizedConfig = DeepReadonly<{
  dev: NormalizedDevConfig;
  html: NormalizedHtmlConfig;
  tools: NormalizedToolsConfig;
  source: NormalizedSourceConfig;
  output: NormalizedOutputConfig;
  security: NormalizedSecurityConfig;
  performance: NormalizedPerformanceConfig;
}>;
