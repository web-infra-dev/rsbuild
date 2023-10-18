export { builderWebpackProvider } from './provider';
export type { BuilderWebpackProvider } from './provider';
export { webpackBuild } from './core/build';
export type { WebpackBuildError } from './core/build';
export { createDefaultConfig } from './config/defaults';
export type {
  LessLoaderOptions,
  SassLoaderOptions,
  PostCSSLoaderOptions,
  CSSLoaderOptions,
  StyleLoaderOptions,
} from '@rsbuild/shared';
export type {
  BuilderPlugin,
  BuilderPluginAPI,

  // Config Types
  DevConfig,
  HtmlConfig,
  ToolsConfig,
  OutputConfig,
  SourceConfig,
  BuilderConfig,
  SecurityConfig,
  NormalizedConfig,
  PerformanceConfig,
  ExperimentsConfig,

  // Hook Callback Types
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,

  // Third Party Types
  webpack,
  WebpackChain,
  WebpackConfig,
  CSSExtractOptions,
  HTMLPluginOptions,
} from './types';
