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

// Constants
export { PLUGIN_SWC_NAME, PLUGIN_CSS_NAME } from './constants';

// Types
export type {
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
  RsbuildPlugin,
  RsbuildPlugins,
  RsbuildPluginAPI,
  RsbuildMode,
  RsbuildEntry,
  RsbuildTarget,
  RsbuildContext,
  BuildOptions,
  CreateCompiler,
  CreateCompilerOptions,
  CreateRsbuildOptions,
  RsbuildInstance,
  RsbuildProvider,
  EnvironmentContext,
  InspectConfigResult,
  InspectConfigOptions,
  Minify,
  Polyfill,
  PrintUrls,
  PublicDir,
  Decorators,
  RspackRule,
  RspackChain,
  WatchFiles,
  CSSModules,
  CrossOrigin,
  ConsoleType,
  SplitChunks,
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
  TransformImport,
  PublicDirOptions,
  PreconnectOption,
  CSSLoaderOptions,
  ModifyChainUtils,
  StyleLoaderOptions,
  PostCSSLoaderOptions,
  ConfigChainWithContext,
  ModifyRspackConfigUtils,
  CSSModulesLocalsConvention,
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
  ModifyWebpackChainFn,
  ModifyRsbuildConfigFn,
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
  ModifyBundlerChainUtils,
  TransformFn,
  TransformHandler,
  ServerAPIs,
  RequestHandler,
  PluginManager,
  CacheGroup,
  CacheGroups,
  BundlerPluginInstance,
} from './types';
export type { ChainIdentifier } from './configChain';

export {
  /**
   * @private
   */
  __internalHelper,
};
