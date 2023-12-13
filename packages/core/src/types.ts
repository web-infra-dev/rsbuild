import type {
  Context as BaseContext,
  RsbuildConfig,
  RsbuildPlugin,
  NormalizedConfig,
  RsbuildPluginAPI,
} from '@rsbuild/shared';
import type { Hooks } from './provider/core/initHooks';

export type { RsbuildPlugin, RsbuildPluginAPI };

/** The inner context. */
export type Context = BaseContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current Rsbuild config. */
  config: Readonly<RsbuildConfig>;
  /** The original Rsbuild config passed from the createRsbuild method. */
  originalConfig: Readonly<RsbuildConfig>;
  /** The normalized Rsbuild config. */
  normalizedConfig?: NormalizedConfig;
  /** The plugin API. */
  pluginAPI?: RsbuildPluginAPI;
};

export type {
  RsbuildConfig,
  NormalizedConfig,
  DevConfig,
  HtmlConfig,
  ToolsConfig,
  SourceConfig,
  OutputConfig,
  SecurityConfig,
  PerformanceConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedToolsConfig,
  NormalizedSourceConfig,
  NormalizedOutputConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
} from '@rsbuild/shared';
