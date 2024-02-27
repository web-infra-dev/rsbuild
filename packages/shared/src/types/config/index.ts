import type { DevConfig, NormalizedDevConfig } from './dev';
import type { ServerConfig, NormalizedServerConfig } from './server';
import type { HtmlConfig, NormalizedHtmlConfig } from './html';
import type { OutputConfig, NormalizedOutputConfig } from './output';
import type { SourceConfig, NormalizedSourceConfig } from './source';
import type { SecurityConfig, NormalizedSecurityConfig } from './security';
import type {
  PerformanceConfig,
  NormalizedPerformanceConfig,
} from './performance';
import type { ToolsConfig, NormalizedToolsConfig } from './tools';
import type { DeepReadonly } from '../utils';
import type { RsbuildPlugins, RsbuildProvider } from '..';
import type { ModuleFederationPluginOptions } from '@rspack/core';

export type ModuleFederationConfig = {
  options: ModuleFederationPluginOptions;
};

export type NormalizedModuleFederationConfig = ModuleFederationConfig;

export type RsbuildConfigMeta = {
  /**
   * Path to the rsbuild config file.
   */
  configFilePath: string;
};

/**
 * The shared Rsbuild config.
 * Can be used with both Rspack and Webpack.
 * */
export interface RsbuildConfig {
  /**
   * Options for local development.
   */
  dev?: DevConfig;
  /**
   * Options for HTML generation.
   */
  html?: HtmlConfig;
  /**
   * Options for the low-level tools.
   */
  tools?: ToolsConfig;
  /**
   * Options for source code parsing and compilation.
   */
  source?: SourceConfig;
  /**
   * Options for the Rsbuild Server,
   * will take effect during local development and preview.
   */
  server?: ServerConfig;
  /**
   * Options for build outputs.
   */
  output?: OutputConfig;
  /**
   * Configure Rsbuild plugins.
   */
  plugins?: RsbuildPlugins;
  /**
   * Options for Web security.
   */
  security?: SecurityConfig;
  /**
   * Options for build performance and runtime performance.
   */
  performance?: PerformanceConfig;
  /**
   * Options for module federation.
   */
  moduleFederation?: ModuleFederationConfig;
  /**
   * Used to switch the bundler type.
   */
  provider?: RsbuildProvider<'rspack'> | RsbuildProvider<'webpack'>;
  /**
   * @private
   */
  _privateMeta?: RsbuildConfigMeta;
}

export type NormalizedConfig = DeepReadonly<{
  dev: NormalizedDevConfig;
  html: NormalizedHtmlConfig;
  tools: NormalizedToolsConfig;
  source: NormalizedSourceConfig;
  server: NormalizedServerConfig;
  output: NormalizedOutputConfig;
  plugins?: RsbuildPlugins;
  security: NormalizedSecurityConfig;
  performance: NormalizedPerformanceConfig;
  moduleFederation?: ModuleFederationConfig;
  provider?: RsbuildProvider<'rspack'> | RsbuildProvider<'webpack'>;
  _privateMeta?: RsbuildConfigMeta;
}>;

export * from './dev';
export * from './html';
export * from './tools';
export * from './source';
export * from './server';
export * from './output';
export * from './security';
export * from './performance';
