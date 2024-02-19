/**
 * The methods and types exported from this file are considered as
 * the public API of @rsbuild/core.
 */

// Core Methods
export { loadEnv } from './loadEnv';
export { createRsbuild } from './createRsbuild';
export { loadConfig, defineConfig } from './cli/config';

export const version = RSBUILD_VERSION;

// Helpers
export { logger, mergeRsbuildConfig } from '@rsbuild/shared';

// Constants
export {
  PLUGIN_SWC_NAME,
  PLUGIN_CSS_NAME,
  PLUGIN_SASS_NAME,
  PLUGIN_LESS_NAME,
  PLUGIN_STYLUS_NAME,
} from './constants';

// Types
export type { Rspack } from './provider';
export type {
  // Config Types
  RsbuildConfig,
  DevConfig,
  HtmlConfig,
  ToolsConfig,
  SourceConfig,
  ServerConfig,
  OutputConfig,
  SecurityConfig,
  PerformanceConfig,
  ModuleFederationConfig,
  // Normalized Config Types
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedToolsConfig,
  NormalizedSourceConfig,
  NormalizedServerConfig,
  NormalizedOutputConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
  NormalizedModuleFederationConfig,
  // Plugin Types
  RsbuildPlugin,
  RsbuildPlugins,
  RsbuildPluginAPI,
} from './types';

export type {
  RsbuildMode,
  RsbuildEntry,
  RsbuildTarget,
  RsbuildContext,
  RsbuildInstance,
  CreateRsbuildOptions,
  InspectConfigOptions,
  // Hook Callback Types
  OnExitFn,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeBuildFn,
  OnBeforeStartDevServerFn,
  OnBeforeStartProdServerFn,
  OnBeforeCreateCompilerFn,
  OnCloseDevServerFn,
  OnDevCompileDoneFn,
  ModifyRsbuildConfigFn,
} from '@rsbuild/shared';
