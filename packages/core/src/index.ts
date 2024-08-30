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
  AppIcon,
  AppIconItem,
  AliasStrategy,
  Build,
  BuildOptions,
  BundlerPluginInstance,
  CacheGroup,
  CacheGroups,
  ClientConfig,
  ConfigChain,
  ConfigChainWithContext,
  ConsoleType,
  CreateCompiler,
  CreateCompilerOptions,
  CreateRsbuildOptions,
  ResolvedCreateRsbuildOptions,
  CrossOrigin,
  CSSLoaderOptions,
  CSSModules,
  CSSModulesLocalsConvention,
  Decorators,
  DevConfig,
  DistPathConfig,
  EnvironmentContext,
  EnvironmentConfig,
  FilenameConfig,
  HtmlConfig,
  HtmlRspackPlugin,
  HtmlBasicTag,
  HtmlTagHandler,
  HtmlTagDescriptor,
  InspectConfigOptions,
  InspectConfigResult,
  LegalComments,
  Minify,
  ModifyBundlerChainFn,
  ModifyBundlerChainUtils,
  ModifyChainUtils,
  ModifyRspackConfigFn,
  ModifyRspackConfigUtils,
  ModifyRsbuildConfigFn,
  ModifyWebpackChainFn,
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
  ModuleFederationConfig,
  MergedEnvironmentConfig,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedEnvironmentConfig,
  NormalizedHtmlConfig,
  NormalizedModuleFederationConfig,
  NormalizedOutputConfig,
  NormalizedPerformanceConfig,
  NormalizedSecurityConfig,
  NormalizedServerConfig,
  NormalizedSourceConfig,
  NormalizedToolsConfig,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
  OnBeforeStartDevServerFn,
  OnBeforeStartProdServerFn,
  OnCloseDevServerFn,
  OnDevCompileDoneFn,
  OnExitFn,
  OutputConfig,
  OutputStructure,
  PerformanceConfig,
  PluginManager,
  Polyfill,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  PreconnectOption,
  PrintUrls,
  PublicDir,
  PublicDirOptions,
  RequestHandler,
  RsbuildConfig,
  RsbuildContext,
  RsbuildEntry,
  RsbuildEntryDescription,
  RsbuildInstance,
  RsbuildMode,
  RsbuildPlugin,
  RsbuildPluginAPI,
  RsbuildPlugins,
  RsbuildProvider,
  RsbuildTarget,
  RspackChain,
  RspackRule,
  ScriptInject,
  ScriptLoading,
  SecurityConfig,
  ServerAPIs,
  ServerConfig,
  SourceConfig,
  SplitChunks,
  StyleLoaderOptions,
  ToolsConfig,
  TransformFn,
  TransformHandler,
  TransformImport,
  WatchFiles,
} from './types';
export type { ChainIdentifier } from './configChain';

export {
  /**
   * @private
   */
  __internalHelper,
};
