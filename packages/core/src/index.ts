/**
 * The methods and types exported from this file are considered as
 * the public API of @rsbuild/core.
 */
import { rspack } from '@rspack/core';
import type * as Rspack from '@rspack/core';
import * as __internalHelper from './internal';

// Core methods
export { loadEnv } from './loadEnv';
export { createRsbuild } from './createRsbuild';
export { loadConfig, defineConfig } from './config';

// Rsbuild version
export const version: string = RSBUILD_VERSION;

// Rspack instance
export { rspack };
export type { Rspack };

// Helpers
export { logger } from './logger';
export { mergeRsbuildConfig } from './mergeConfig';
export { ensureAssetPrefix } from './helpers';
export { reduceConfigs, reduceConfigsWithContext } from './reduceConfigs';

// Constants
export { PLUGIN_SWC_NAME, PLUGIN_CSS_NAME } from './constants';

// Types
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
  NormalizedEnvironmentConfig,
  // Plugin Types
  RsbuildPlugin,
  RsbuildPlugins,
  RsbuildPluginAPI,
  // Others
  RsbuildInstance,
  RsbuildProvider,
  CreateRsbuildOptions,
} from './types';

export type {
  RsbuildMode,
  RsbuildEntry,
  RsbuildTarget,
  RsbuildContext,
  EnvironmentContext,
  InspectConfigResult,
  InspectConfigOptions,
  // Subtypes of Config
  Minify,
  Polyfill,
  PrintUrls,
  PublicDir,
  Decorators,
  RspackRule,
  WatchFiles,
  CSSModules,
  CrossOrigin,
  ConsoleType,
  SplitChunks,
  RspackChain,
  ClientConfig,
  ScriptInject,
  ConfigChain,
  PostCSSPlugin,
  ScriptLoading,
  LegalComments,
  AliasStrategy,
  FilenameConfig,
  DistPathConfig,
  OutputStructure,
  ChainIdentifier,
  PublicDirOptions,
  PreconnectOption,
  CSSLoaderOptions,
  ModifyChainUtils,
  StyleLoaderOptions,
  PostCSSLoaderOptions,
  ConfigChainWithContext,
  ModifyRspackConfigUtils,
  CSSModulesLocalsConvention,
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
  ModifyBundlerChainFn,
  ModifyRspackConfigFn,
  ModifyRsbuildConfigFn,
  TransformFn,
  TransformHandler,
  ServerAPIs,
  RequestHandler,
} from '@rsbuild/shared';

export {
  /**
   * @private
   */
  __internalHelper,
};
