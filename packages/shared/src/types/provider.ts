import type { PluginStore, Plugins, RsbuildPluginAPI } from './plugin';
import type { Context } from './context';
import type { Compiler, MultiCompiler } from '@rspack/core';
import type { RsbuildMode, CreateRsbuildOptions } from './rsbuild';
import { StartServerResult } from './server';
import type { AddressUrl } from '../url';
import type { Logger } from '../logger';
import { RsbuildConfig, RspackConfig, WebpackConfig } from '.';

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

export type RsbuildProvider<B extends 'rspack' | 'webpack' = 'rspack'> =
  (options: {
    pluginStore: PluginStore;
    rsbuildOptions: Required<CreateRsbuildOptions>;
    plugins: Plugins;
  }) => Promise<ProviderInstance<B>>;

export type ProviderInstance<B extends 'rspack' | 'webpack' = 'rspack'> = {
  readonly bundler: Bundler;

  readonly publicContext: Readonly<Context>;

  pluginAPI: RsbuildPluginAPI;

  applyDefaultPlugins: (pluginStore: PluginStore) => Promise<void>;

  createCompiler: (
    options?: CreateCompilerOptions,
  ) => Promise<Compiler | MultiCompiler>;

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartServerResult>;

  preview: (options?: PreviewServerOptions) => Promise<StartServerResult>;

  build: (options?: BuildOptions) => Promise<void>;

  initConfigs: () => Promise<
    B extends 'rspack' ? RspackConfig[] : WebpackConfig[]
  >;

  inspectConfig: (options?: InspectConfigOptions) => Promise<{
    rsbuildConfig: string;
    bundlerConfigs: string[];
    origin: {
      rsbuildConfig: RsbuildConfig & {
        pluginNames: string[];
      };
      bundlerConfigs: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
    };
  }>;
};
