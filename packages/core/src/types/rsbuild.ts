import type { Compiler, MultiCompiler } from '@rspack/core';
import type * as providerHelpers from '../provider/helpers';
import type { RsbuildDevServer } from '../server/devServer';
import type { StartServerResult } from '../server/helper';
import type { RsbuildConfig } from './config';
import type { NormalizedConfig, NormalizedEnvironmentConfig } from './config';
import type { InternalContext, RsbuildContext } from './context';
import type { PluginManager, RsbuildPluginAPI } from './plugin';
import type { Rspack } from './rspack';
import type { WebpackConfig } from './thirdParty';

export type Bundler = 'rspack' | 'webpack';

export type StartDevServerOptions = {
  /**
   * Using a custom Rspack Compiler object.
   */
  compiler?: Compiler | MultiCompiler;
  /**
   * Whether to get port silently and not print any logs.
   * @default false
   */
  getPortSilently?: boolean;
};

export type CreateDevServerOptions = StartDevServerOptions & {
  /**
   * Whether to trigger Rsbuild compilation
   *
   * @default true
   */
  runCompile?: boolean;
};

export type PreviewOptions = {
  /**
   * Whether to get port silently and not print any logs.
   * @default false
   */
  getPortSilently?: boolean;
  /**
   * Whether to check if the dist directory exists and is not empty.
   * @default true
   */
  checkDistDir?: boolean;
};

export type BuildOptions = {
  /**
   * Whether to watch for file changes and rebuild.
   * @default false
   */
  watch?: boolean;
  /**
   * Using a custom Rspack Compiler object.
   */
  compiler?: Compiler | MultiCompiler;
};

export type Build = (options?: BuildOptions) => Promise<{
  /**
   * Stop watching when in watch mode.
   */
  close: () => Promise<void>;
  /**
   * Rspack's [stats](https://rspack.dev/api/javascript-api/stats) object.
   */
  stats?: Rspack.Stats | Rspack.MultiStats;
}>;

export type InspectConfigOptions = {
  mode?: RsbuildMode;
  verbose?: boolean;
  outputPath?: string;
  writeToDisk?: boolean;
};

export type InspectConfigResult<B extends 'rspack' | 'webpack' = 'rspack'> = {
  rsbuildConfig: string;
  bundlerConfigs: string[];
  environmentConfigs: string[];
  origin: {
    rsbuildConfig: Omit<NormalizedConfig, 'environments'>;
    environmentConfigs: Record<string, NormalizedEnvironmentConfig>;
    bundlerConfigs: B extends 'rspack'
      ? Rspack.Configuration[]
      : WebpackConfig[];
  };
};

// Allow user to manually narrow Compiler type
export type CreateCompiler = <C = Compiler | MultiCompiler>() => Promise<C>;

export type CreateRsbuildOptions = {
  /**
   * The root path of current project.
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Only build specified environments.
   * For example, passing `['web']` will only build the `web` environment.
   * If not specified or passing an empty array, all environments will be built.
   */
  environment?: string[];
  /**
   * Rsbuild configurations.
   */
  rsbuildConfig?: RsbuildConfig;
};

export type ResolvedCreateRsbuildOptions = CreateRsbuildOptions &
  Required<Omit<CreateRsbuildOptions, 'environment'>>;

export type CreateDevServer = (
  options?: CreateDevServerOptions,
) => Promise<RsbuildDevServer>;

export type StartDevServer = (
  options?: StartDevServerOptions,
) => Promise<StartServerResult>;

export type ProviderInstance<B extends 'rspack' | 'webpack' = 'rspack'> = {
  readonly bundler: Bundler;

  createCompiler: CreateCompiler;

  /**
   * It is designed for higher-level frameworks that require a custom server
   */
  createDevServer: CreateDevServer;

  startDevServer: StartDevServer;

  build: Build;

  initConfigs: () => Promise<
    B extends 'rspack' ? Rspack.Configuration[] : WebpackConfig[]
  >;

  inspectConfig: (
    options?: InspectConfigOptions,
  ) => Promise<InspectConfigResult<B>>;
};

export type RsbuildProviderHelpers = typeof providerHelpers;

export type RsbuildProvider<B extends 'rspack' | 'webpack' = 'rspack'> =
  (options: {
    context: InternalContext;
    pluginManager: PluginManager;
    rsbuildOptions: ResolvedCreateRsbuildOptions;
    helpers: RsbuildProviderHelpers;
  }) => Promise<ProviderInstance<B>>;

export type RsbuildInstance = {
  context: RsbuildContext;

  addPlugins: PluginManager['addPlugins'];
  getPlugins: PluginManager['getPlugins'];
  removePlugins: PluginManager['removePlugins'];
  isPluginExists: PluginManager['isPluginExists'];

  build: ProviderInstance['build'];
  preview: (options?: PreviewOptions) => Promise<StartServerResult>;
  initConfigs: ProviderInstance['initConfigs'];
  inspectConfig: ProviderInstance['inspectConfig'];
  createCompiler: ProviderInstance['createCompiler'];
  createDevServer: ProviderInstance['createDevServer'];
  startDevServer: ProviderInstance['startDevServer'];

  getRsbuildConfig: RsbuildPluginAPI['getRsbuildConfig'];
  getNormalizedConfig: RsbuildPluginAPI['getNormalizedConfig'];

  onBeforeBuild: RsbuildPluginAPI['onBeforeBuild'];
  onBeforeCreateCompiler: RsbuildPluginAPI['onBeforeCreateCompiler'];
  onBeforeStartDevServer: RsbuildPluginAPI['onBeforeStartDevServer'];
  onBeforeStartProdServer: RsbuildPluginAPI['onBeforeStartProdServer'];
  onAfterBuild: RsbuildPluginAPI['onAfterBuild'];
  onAfterCreateCompiler: RsbuildPluginAPI['onAfterCreateCompiler'];
  onAfterStartDevServer: RsbuildPluginAPI['onAfterStartDevServer'];
  onAfterStartProdServer: RsbuildPluginAPI['onAfterStartProdServer'];
  onCloseDevServer: RsbuildPluginAPI['onCloseDevServer'];
  onDevCompileDone: RsbuildPluginAPI['onDevCompileDone'];
  onExit: RsbuildPluginAPI['onExit'];
  onCloseBuild: RsbuildPluginAPI['onCloseBuild'];
};

export type RsbuildTarget = 'web' | 'node' | 'web-worker';

export type RsbuildEntryDescription = Rspack.EntryDescription & {
  /**
   * Whether to generate an HTML file for the entry.
   *
   * @default true
   */
  html?: boolean;
};

export type RsbuildEntry = Record<
  string,
  string | string[] | RsbuildEntryDescription
>;

export type RsbuildMode = 'development' | 'production' | 'none';
