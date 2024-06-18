import type { ModuleFederationPluginOptions } from '@rspack/core';
import type { RsbuildPlugins } from '..';
import type { DeepReadonly } from '../utils';
import type { DevConfig, NormalizedDevConfig } from './dev';
import type { HtmlConfig, NormalizedHtmlConfig } from './html';
import type { NormalizedOutputConfig, OutputConfig } from './output';
import type {
  NormalizedPerformanceConfig,
  PerformanceConfig,
} from './performance';
import type { NormalizedSecurityConfig, SecurityConfig } from './security';
import type { NormalizedServerConfig, ServerConfig } from './server';
import type { NormalizedSourceConfig, SourceConfig } from './source';
import type { NormalizedToolsConfig, ToolsConfig } from './tools';

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
 * The Rsbuild config to run in the specified environment.
 * */
export interface EnvironmentConfig {
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
   * Options for build outputs.
   */
  output?: OutputConfig;
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
}

/**
 * The Rsbuild config.
 * */
export interface RsbuildConfig extends EnvironmentConfig {
  /**
   * Options for local development.
   */
  dev?: DevConfig;
  /**
   * Options for the Rsbuild Server,
   * will take effect during local development and preview.
   */
  server?: ServerConfig;
  /**
   * Configure Rsbuild plugins.
   */
  plugins?: RsbuildPlugins;
  /**
   * Configure rsbuild config by environment.
   */
  environments?: {
    [name: string]: EnvironmentConfig;
  };
  /**
   * Used to switch the bundler type.
   */
  provider?: unknown;
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
  provider?: unknown;
  _privateMeta?: RsbuildConfigMeta;
  environments?: {
    [name: string]: EnvironmentConfig;
  };
}>;

export * from './dev';
export * from './html';
export * from './tools';
export * from './source';
export * from './server';
export * from './output';
export * from './security';
export * from './performance';
