import type { PluginStore, Plugins, RsbuildPluginAPI } from './plugin';
import type { Context } from './context';
import type { Compiler, MultiCompiler } from '@rspack/core';
import type { RsbuildMode, CreateRsbuildOptions } from './rsbuild';
import type { StartServerResult, DevServerAPIs } from './server';
import type { AddressUrl } from '../url';
import type { Logger } from '../logger';
import type { NormalizedConfig } from './config';
import type { WebpackConfig } from './thirdParty';
import type { RspackConfig } from './rspack';

export type Bundler = 'rspack' | 'webpack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  compiler?: Compiler | MultiCompiler;
  printURLs?: boolean | ((urls: AddressUrl[]) => AddressUrl[]);
  logger?: Logger;
  getPortSilently?: boolean;
};

export type PreviewServerOptions = {
  printURLs?: boolean | ((urls: AddressUrl[]) => AddressUrl[]);
  getPortSilently?: boolean;
};

export type BuildOptions = {
  mode?: RsbuildMode;
  watch?: boolean;
  compiler?: Compiler | MultiCompiler;
};

export type InspectConfigOptions = {
  env?: RsbuildMode;
  verbose?: boolean;
  outputPath?: string;
  writeToDisk?: boolean;
};

export type InspectConfigResult<B extends 'rspack' | 'webpack' = 'rspack'> = {
  rsbuildConfig: string;
  bundlerConfigs: string[];
  origin: {
    rsbuildConfig: NormalizedConfig & {
      pluginNames: string[];
    };
    bundlerConfigs: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
  };
};

export type RsbuildProvider<B extends 'rspack' | 'webpack' = 'rspack'> =
  (options: {
    plugins: Plugins;
    pluginStore: PluginStore;
    rsbuildOptions: Required<CreateRsbuildOptions>;
  }) => Promise<ProviderInstance<B>>;

export type ProviderInstance<B extends 'rspack' | 'webpack' = 'rspack'> = {
  readonly bundler: Bundler;

  readonly publicContext: Readonly<Context>;

  pluginAPI: RsbuildPluginAPI;

  applyDefaultPlugins: (pluginStore: PluginStore) => Promise<void>;

  createCompiler: (
    options?: CreateCompilerOptions,
  ) => Promise<Compiler | MultiCompiler>;

  /**
   * This API is not stable
   *
   * It is designed for high-level frameworks that require a custom server
   */
  getServerAPIs: (
    options?: Omit<StartDevServerOptions, 'printURLs'>,
  ) => Promise<DevServerAPIs>;

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartServerResult>;

  preview: (options?: PreviewServerOptions) => Promise<StartServerResult>;

  build: (options?: BuildOptions) => Promise<void>;

  initConfigs: () => Promise<
    B extends 'rspack' ? RspackConfig[] : WebpackConfig[]
  >;

  inspectConfig: (
    options?: InspectConfigOptions,
  ) => Promise<InspectConfigResult<B>>;
};
