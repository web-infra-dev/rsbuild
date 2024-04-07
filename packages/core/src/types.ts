import type {
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildPlugins,
  RsbuildContext,
  NormalizedConfig,
  RsbuildPluginAPI,
  TransformHandler,
} from '@rsbuild/shared';
import type { Hooks } from './initHooks';

declare module '@rspack/core' {
  interface Compiler {
    __rsbuildTransformer?: Record<string, TransformHandler>;
  }
}

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
  ServerConfig,
  OutputConfig,
  SecurityConfig,
  PerformanceConfig,
  ModuleFederationConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedToolsConfig,
  NormalizedSourceConfig,
  NormalizedServerConfig,
  NormalizedOutputConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
  NormalizedModuleFederationConfig,
} from '@rsbuild/shared';
