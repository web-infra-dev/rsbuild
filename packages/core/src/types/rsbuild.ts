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
  /**
   * A read-only object that provides some context information.
   */
  context: RsbuildContext;
  /**
   * Register one or more Rsbuild plugins, which can be called multiple times.
   * This method needs to be called before compiling. If it is called after
   * compiling, it will not affect the compilation result.
   */
  addPlugins: PluginManager['addPlugins'];
  /**
   * Get all the Rsbuild plugins registered in the current Rsbuild instance.
   */
  getPlugins: PluginManager['getPlugins'];
  /**
   * Removes one or more Rsbuild plugins, which can be called multiple times.
   * This method needs to be called before compiling. If it is called after
   * compiling, it will not affect the compilation result.
   */
  removePlugins: PluginManager['removePlugins'];
  /**
   * Determines if a plugin has been registered in the current Rsbuild instance.
   */
  isPluginExists: PluginManager['isPluginExists'];
  /**
   * Perform a production mode build. This method will generate optimized
   * production bundles and emit them to the output directory.
   */
  build: ProviderInstance['build'];
  /**
   * Start a server to preview the production build locally.
   * This method should be executed after `rsbuild.build`.
   */
  preview: (options?: PreviewOptions) => Promise<StartServerResult>;
  /**
   * Initialize and return the internal Rspack configurations used by Rsbuild.
   * This method processes all plugins and configurations to generate the final
   * Rspack configs. Note: You typically don't need to call this method directly
   * since it's automatically invoked by methods like `rsbuild.build` and
   * `rsbuild.startDevServer`.
   */
  initConfigs: ProviderInstance['initConfigs'];
  /**
   * Inspect and debug Rsbuild's internal configurations. It provides access to:
   * - The resolved Rsbuild configuration
   * - The environment-specific Rsbuild configurations
   * - The generated Rspack configurations
   *
   * The method serializes these configurations to strings and optionally writes
   * them to disk for inspection.
   */
  inspectConfig: ProviderInstance['inspectConfig'];
  /**
   * Create an Rspack [Compiler](https://rspack.dev/api/javascript-api/compiler)
   * instance. If there are multiple [environments](/config/environments) for
   * this build, the return value is `MultiCompiler`.
   */
  createCompiler: ProviderInstance['createCompiler'];
  /**
   * Rsbuild includes a built-in dev server designed to improve the development
   * experience. When you run the `rsbuild dev` command, the server starts
   * automatically and provides features such as page preview, routing, and hot
   * module reloading.
   *
   * If you want to integrate the Rsbuild dev server into a custom server, you
   * can use the `createDevServer` method to create a dev server instance and
   * call its methods as needed.
   *
   * If you want to directly start the Rsbuild dev server, use the
   * `rsbuild.startDevServer` method.
   */
  createDevServer: ProviderInstance['createDevServer'];
  /**
   * Start the local dev server. This method will:
   *
   * 1. Start a development server that serves your application.
   * 2. Watch for file changes and trigger recompilation.
   */
  startDevServer: ProviderInstance['startDevServer'];
  /**
   * Get the Rsbuild config, this method must be called after the
   * `modifyRsbuildConfig` hook is executed.
   */
  getRsbuildConfig: RsbuildPluginAPI['getRsbuildConfig'];
  /**
   * Get the all normalized Rsbuild config or the Rsbuild config of a specified
   * environment, this method must be called after the
   * `modifyRsbuildConfig` hook is executed.
   */
  getNormalizedConfig: RsbuildPluginAPI['getNormalizedConfig'];
  /**
   * A callback function that is triggered before the production build is executed.
   */
  onBeforeBuild: RsbuildPluginAPI['onBeforeBuild'];
  /**
   * A callback function that is triggered after the Compiler instance has been
   * created, but before the build process begins. This hook is called when you
   * run `rsbuild.startDevServer`, `rsbuild.build`, or `rsbuild.createCompiler`.
   */
  onBeforeCreateCompiler: RsbuildPluginAPI['onBeforeCreateCompiler'];
  /**
   * Called before starting the dev server.
   */
  onBeforeStartDevServer: RsbuildPluginAPI['onBeforeStartDevServer'];
  /**
   * Called before starting the production preview server.
   */
  onBeforeStartProdServer: RsbuildPluginAPI['onBeforeStartProdServer'];
  /**
   * A callback function that is triggered after running the production build.
   * You can access the build result information via the
   * [stats](https://rspack.dev/api/javascript-api/stats) parameter.
   */
  onAfterBuild: RsbuildPluginAPI['onAfterBuild'];
  /**
   * A callback function that is triggered after the compiler instance has been
   * created, but before the build process. This hook is called when you run
   * `rsbuild.startDevServer`, `rsbuild.build`, or `rsbuild.createCompiler`.
   */
  onAfterCreateCompiler: RsbuildPluginAPI['onAfterCreateCompiler'];
  /**
   * Called after starting the dev server, you can get the port number with the
   * `port` parameter, and the page routes info with the `routes` parameter.
   */
  onAfterStartDevServer: RsbuildPluginAPI['onAfterStartDevServer'];
  /**
   * Called after starting the production preview server, you can get the port
   * number with the `port` parameter, and the page routes info with the
   * `routes` parameter.
   */
  onAfterStartProdServer: RsbuildPluginAPI['onAfterStartProdServer'];
  /**
   * Called when closing the dev server. Can be used to perform cleanup
   * operations when the dev server is closed.
   */
  onCloseDevServer: RsbuildPluginAPI['onCloseDevServer'];
  /**
   * Called after each development mode build, you can use `isFirstCompile`
   * to determine whether it is the first build.
   */
  onDevCompileDone: RsbuildPluginAPI['onDevCompileDone'];
  /**
   * Called when the process is going to exit, this hook can only execute
   * synchronous code.
   */
  onExit: RsbuildPluginAPI['onExit'];
  /**
   * Called when closing the build instance. Can be used to perform cleanup
   * operations when the building is closed.
   */
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
