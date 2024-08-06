import type { EntryDescription } from '@rspack/core';
import type { Compiler, MultiCompiler } from '@rspack/core';
import type { RsbuildDevServer } from '../server/devServer';
import type { StartServerResult } from '../server/helper';
import type { RsbuildConfig } from './config';
import type { NormalizedConfig, NormalizedEnvironmentConfig } from './config';
import type { InternalContext, RsbuildContext } from './context';
import type { PluginManager, RsbuildPluginAPI } from './plugin';
import type { RspackConfig } from './rspack';
import type { WebpackConfig } from './thirdParty';

export type Bundler = 'rspack' | 'webpack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  compiler?: Compiler | MultiCompiler;
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

export type PreviewServerOptions = {
  getPortSilently?: boolean;
};

export type BuildOptions = {
  mode?: RsbuildMode;
  watch?: boolean;
  compiler?: Compiler | MultiCompiler;
};

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
    rsbuildConfig: Omit<NormalizedConfig, 'environments'> & {
      pluginNames: string[];
    };
    environmentConfigs: Record<
      string,
      NormalizedEnvironmentConfig & {
        pluginNames: string[];
      }
    >;
    bundlerConfigs: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
  };
};

export type CreateCompiler =
  // Allow user to manually narrow Compiler type
  <C = Compiler | MultiCompiler>(options?: CreateCompilerOptions) => Promise<C>;

export type CreateRsbuildOptions = {
  /** The root path of current project. */
  cwd?: string;
  /** Configurations of Rsbuild. */
  rsbuildConfig?: RsbuildConfig;
  /** Only build specified environment. */
  environment?: string[];
};

export type ResolvedCreateRsbuildOptions = CreateRsbuildOptions &
  Required<Omit<CreateRsbuildOptions, 'environment'>>;

export type ProviderInstance<B extends 'rspack' | 'webpack' = 'rspack'> = {
  readonly bundler: Bundler;

  createCompiler: CreateCompiler;

  /**
   * It is designed for high-level frameworks that require a custom server
   */
  createDevServer: (
    options?: CreateDevServerOptions,
  ) => Promise<RsbuildDevServer>;

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartServerResult>;

  build: (options?: BuildOptions) => Promise<void | {
    close: () => Promise<void>;
  }>;

  initConfigs: () => Promise<
    B extends 'rspack' ? RspackConfig[] : WebpackConfig[]
  >;

  inspectConfig: (
    options?: InspectConfigOptions,
  ) => Promise<InspectConfigResult<B>>;
};

export type RsbuildProvider<B extends 'rspack' | 'webpack' = 'rspack'> =
  (options: {
    context: InternalContext;
    pluginManager: PluginManager;
    rsbuildOptions: ResolvedCreateRsbuildOptions;
    setCssExtractPlugin: (plugin: unknown) => void;
  }) => Promise<ProviderInstance<B>>;

export type RsbuildInstance = {
  context: RsbuildContext;

  addPlugins: PluginManager['addPlugins'];
  getPlugins: PluginManager['getPlugins'];
  removePlugins: PluginManager['removePlugins'];
  isPluginExists: PluginManager['isPluginExists'];

  build: ProviderInstance['build'];
  preview: (options?: PreviewServerOptions) => Promise<StartServerResult>;
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
};

export type RsbuildTarget = 'web' | 'node' | 'web-worker';

export type RsbuildEntry = Record<string, string | string[] | EntryDescription>;

export type RsbuildMode = 'development' | 'production';
