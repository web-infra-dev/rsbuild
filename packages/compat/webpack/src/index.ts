export { webpackProvider } from './provider';
export type { WebpackProvider } from './provider';
export { webpackBuild } from './core/build';
export { createDefaultConfig } from './config/defaults';
export type {
  LessLoaderOptions,
  SassLoaderOptions,
  PostCSSLoaderOptions,
  CSSLoaderOptions,
  StyleLoaderOptions,
} from '@rsbuild/shared';
export type {
  RsbuildPlugin,
  RsbuildPluginAPI,

  // Config Types
  DevConfig,
  HtmlConfig,
  ToolsConfig,
  OutputConfig,
  SourceConfig,
  RsbuildConfig,
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
