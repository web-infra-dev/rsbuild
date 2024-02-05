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

/**
 * The shared Rsbuild config.
 * Can be used with both Rspack and Webpack.
 * */
export interface RsbuildConfig {
  dev?: DevConfig;
  html?: HtmlConfig;
  tools?: ToolsConfig;
  source?: SourceConfig;
  server?: ServerConfig;
  output?: OutputConfig;
  plugins?: RsbuildPlugins;
  security?: SecurityConfig;
  performance?: PerformanceConfig;
  moduleFederation?: ModuleFederationConfig;
  provider?: RsbuildProvider<'rspack'> | RsbuildProvider<'webpack'>;
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
  moduleFederation: ModuleFederationConfig;
  provider?: RsbuildProvider<'rspack'> | RsbuildProvider<'webpack'>;
}>;

export * from './dev';
export * from './html';
export * from './tools';
export * from './source';
export * from './server';
export * from './output';
export * from './security';
export * from './performance';
