import type { PluginStore, Plugins, DefaultRsbuildPluginAPI } from './plugin';
import type { Context } from './context';
import type { Compiler, MultiCompiler } from '@rspack/core';
import type { RsbuildMode, CreateRsbuildOptions } from './rsbuild';
import { StartServerResult } from './server';
import type { AddressUrl } from '../url';
import type { Logger } from '../logger';
import { RsbuildConfig } from '.';

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

export type RsbuildProvider<
  BundlerConfig extends Record<string, any> = Record<string, any>,
> = (options: {
  pluginStore: PluginStore;
  rsbuildOptions: Required<CreateRsbuildOptions>;
  plugins: Plugins;
}) => Promise<ProviderInstance<BundlerConfig>>;

export type ProviderInstance<
  BundlerConfig extends Record<string, any> = Record<string, any>,
> = {
  readonly bundler: Bundler;

  readonly publicContext: Readonly<Context>;

  pluginAPI: DefaultRsbuildPluginAPI<BundlerConfig>;

  applyDefaultPlugins: (pluginStore: PluginStore) => Promise<void>;

  createCompiler: (
    options?: CreateCompilerOptions,
  ) => Promise<Compiler | MultiCompiler>;

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartServerResult>;

  preview: (options?: PreviewServerOptions) => Promise<StartServerResult>;

  build: (options?: BuildOptions) => Promise<void>;

  initConfigs: () => Promise<BundlerConfig[]>;

  inspectConfig: (options?: InspectConfigOptions) => Promise<{
    rsbuildConfig: string;
    bundlerConfigs: string[];
    origin: {
      rsbuildConfig: RsbuildConfig & {
        pluginNames: string[];
      };
      bundlerConfigs: BundlerConfig[];
    };
  }>;
};
