import type { DeepReadonly } from '@rsbuild/shared';
import type {
  SharedDevConfig,
  NormalizedSharedDevConfig,
} from '@rsbuild/shared';
import type {
  SharedHtmlConfig,
  NormalizedSharedHtmlConfig,
} from '@rsbuild/shared';
import type {
  SharedPerformanceConfig,
  NormalizedSharedPerformanceConfig,
} from '@rsbuild/shared';
import type {
  SharedSecurityConfig,
  NormalizedSharedSecurityConfig,
} from '@rsbuild/shared';
import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
} from '@rsbuild/shared';
import type { Builtins } from '@rspack/core';
import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
} from '@rsbuild/shared';
import type { RspackBuiltinsConfig } from './rspack';
import type { ChainedConfig, SharedToolsConfig } from '@rsbuild/shared';
import type { Options as HTMLPluginOptions } from '@rspack/plugin-html';
import type { RspackConfig } from './rspack';
import type { ModifyRspackConfigUtils } from './hooks';

type ToolsHtmlPluginConfig = ChainedConfig<
  HTMLPluginOptions,
  {
    entryName: string;
    entryValue: string | string[];
  }
>;

export type ToolsRspackConfig = ChainedConfig<
  RspackConfig,
  ModifyRspackConfigUtils
>;

export interface ToolsConfig extends SharedToolsConfig {
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  rspack?: ToolsRspackConfig;
}

export type NormalizedToolsConfig = ToolsConfig;

export type SourceConfig = SharedSourceConfig & {
  define?: RspackBuiltinsConfig['define'];
  transformImport?: false | Builtins['pluginImport'];
};

export type NormalizedSourceConfig = NormalizedSharedSourceConfig & {
  define: Record<string, string>;
  transformImport?: false | Builtins['pluginImport'];
};

export type OutputConfig = SharedOutputConfig & {
  /**
   * Copies the specified file or directory to the dist directory.
   */
  copy?: Builtins['copy'] | NonNullable<Builtins['copy']>['patterns'];
};

export type NormalizedOutputConfig = OutputConfig &
  NormalizedSharedOutputConfig;

export type DevConfig = SharedDevConfig;
export type HtmlConfig = SharedHtmlConfig;
export type SecurityConfig = SharedSecurityConfig;
export type PerformanceConfig = SharedPerformanceConfig;
export type NormalizedDevConfig = NormalizedSharedDevConfig;
export type NormalizedHtmlConfig = NormalizedSharedHtmlConfig;
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
