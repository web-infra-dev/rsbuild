import type {
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildPlugins,
  RsbuildContext,
  NormalizedConfig,
  RsbuildPluginAPI,
} from '@rsbuild/shared';
import type { Hooks } from './provider/core/initHooks';

export type { RsbuildPlugin, RsbuildPlugins, RsbuildPluginAPI };

/** The inner context. */
export type InternalContext = RsbuildContext & {
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
