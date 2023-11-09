import type { PluginStore, Plugins, DefaultRsbuildPluginAPI } from './plugin';
import type { Context } from './context';
import type { Compiler, MultiCompiler } from '@rspack/core';
import type { RsbuildMode, CreateRsbuildOptions } from './rsbuild';
import { StartServerResult, RsbuildDevServerOptions } from './server';
import type { AddressUrl } from '../url';
import type { Logger } from '../logger';

export type Bundler = 'rspack' | 'webpack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  open?: boolean;
  compiler?: Compiler | MultiCompiler;
  printURLs?: boolean | ((urls: AddressUrl[]) => AddressUrl[]);
  logger?: Logger;
  strictPort?: boolean;
  getPortSilently?: boolean;
  serverOptions?: Partial<RsbuildDevServerOptions>;
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
  RsbuildConfig extends Record<string, any> = Record<string, any>,
  BundlerConfig extends Record<string, any> = Record<string, any>,
  NormalizedConfig extends Record<string, any> = Record<string, any>,
  Compiler extends Record<string, any> = Record<string, any>,
> = (options: {
  pluginStore: PluginStore;
  rsbuildOptions: Required<CreateRsbuildOptions>;
  plugins: Plugins;
}) => Promise<
  ProviderInstance<RsbuildConfig, BundlerConfig, NormalizedConfig, Compiler>
>;

export type ProviderInstance<
  RsbuildConfig extends Record<string, any> = Record<string, any>,
  BundlerConfig extends Record<string, any> = Record<string, any>,
  NormalizedConfig extends Record<string, any> = Record<string, any>,
  CommonCompiler extends Record<string, any> = Record<string, any>,
> = {
  readonly bundler: Bundler;

  readonly publicContext: Readonly<Context>;

  pluginAPI: DefaultRsbuildPluginAPI<
    RsbuildConfig,
    NormalizedConfig,
    BundlerConfig,
    CommonCompiler
  >;

  applyDefaultPlugins: (pluginStore: PluginStore) => Promise<void>;

  // TODO using common compiler type
  createCompiler: (
    options?: CreateCompilerOptions,
  ) => Promise<Compiler | MultiCompiler>;

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartServerResult>;

  preview: () => Promise<StartServerResult>;

  build: (options?: BuildOptions) => Promise<void>;

  initConfigs: () => Promise<BundlerConfig[]>;

  inspectConfig: (options?: InspectConfigOptions) => Promise<{
    rsbuildConfig: string;
    bundlerConfigs: string[];
    origin: {
      rsbuildConfig: RsbuildConfig;
      bundlerConfigs: BundlerConfig[];
    };
  }>;
};
