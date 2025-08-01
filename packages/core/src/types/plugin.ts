/** @ts-ignore `webpack` type only exists when `@rsbuild/webpack` is installed */
import type {
  RuleSetRule,
  Configuration as WebpackConfig,
  WebpackPluginInstance,
} from 'webpack';
import type { ChainIdentifier } from '../configChain';
import type { Logger } from '../logger';
import type {
  ModifyRspackConfigUtils,
  NarrowedRspackConfig,
  NormalizedConfig,
  NormalizedEnvironmentConfig,
  RsbuildConfig,
  RspackMerge,
} from './config';
import type { RsbuildContext } from './context';
import type {
  EnvironmentContext,
  ModifyBundlerChainFn,
  ModifyChainUtils,
  ModifyEnvironmentConfigFn,
  ModifyHTMLFn,
  ModifyHTMLTagsFn,
  ModifyRsbuildConfigFn,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnAfterEnvironmentCompileFn,
  OnAfterStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
  OnBeforeEnvironmentCompileFn,
  OnBeforeStartDevServerFn,
  OnBeforeStartProdServerFn,
  OnCloseBuildFn,
  OnCloseDevServerFn,
  OnDevCompileDoneFn,
  OnExitFn,
} from './hooks';
import type {
  AddPluginsOptions,
  RsbuildInstance,
  RsbuildTarget,
} from './rsbuild';
import type { Rspack, RspackChain } from './rspack';
import type { HtmlRspackPlugin } from './thirdParty';
import type { Falsy, MaybePromise } from './utils';

type HookOrder = 'pre' | 'post' | 'default';

export type HookDescriptor<T extends (...args: any[]) => any> = {
  handler: T;
  order: HookOrder;
};

export type EnvironmentAsyncHook<
  Callback extends (...args: any[]) => T,
  T = any,
> = {
  /**
   * Registers a callback function to be executed when the hook is triggered.
   * The callback can be a plain function or a HookDescriptor that includes execution order.
   * The callback will be executed in all environments by default.
   * If you need to specify the environment, use `tapEnvironment`
   * @param cb The callback function or hook descriptor to register
   */
  tap: (cb: Callback | HookDescriptor<Callback>) => void;
  /**
   * Registers a callback function to be executed when the hook is triggered.
   * The callback will only be executed under the specified environment.
   */
  tapEnvironment: (params: {
    /**
     * Specify the environment that the callback will be executed under.
     */
    environment?: string;
    /**
     * The callback function or hook descriptor to register
     */
    handler: Callback | HookDescriptor<Callback>;
  }) => void;
  /**
   * Executes callbacks in sequence independently and collects all their results into an array.
   * Each callback receives the original parameters, and their results don't affect subsequent callbacks.
   * @returns A promise that resolves with an array containing the results of all callbacks
   */
  callChain: (params: {
    /**
     * Specify the environment for filtering callbacks.
     */
    environment?: string;
    /**
     * The parameters to pass to each callback
     */
    args: Parameters<Callback>;
  }) => Promise<Parameters<Callback>>;
  /**
   * Executes callbacks in sequence independently and collects all their results into an array.
   * Each callback receives the original parameters, and their results don't affect subsequent callbacks.
   * @returns A promise that resolves with an array containing the results of all callbacks
   */
  callBatch: (params: {
    /**
     * Specify the environment for filtering callbacks.
     */
    environment?: string;
    /**
     * The parameters to pass to each callback
     */
    args: Parameters<Callback>;
  }) => Promise<Awaited<ReturnType<Callback>>[]>;
};

export type AsyncHook<Callback extends (...args: any[]) => T, T = any> = {
  /**
   * Registers a callback function to be executed when the hook is triggered.
   * The callback can be a plain function or a HookDescriptor that includes execution order.
   * @param cb The callback function or hook descriptor to register
   */
  tap: (cb: Callback | HookDescriptor<Callback>) => void;
  /**
   * Executes callbacks in sequence, passing the result of each callback as the first argument
   * to the next callback in the chain. If a callback returns undefined, the original arguments
   * will be passed to the next callback.
   * @param params The initial parameters to pass to the first callback
   * @returns A promise that resolves with the final parameters after all callbacks have executed
   */
  callChain: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
  /**
   * Executes callbacks in sequence independently and collects all their results into an array.
   * Each callback receives the original parameters, and their results don't affect subsequent callbacks.
   * @param params The parameters to pass to each callback
   * @returns A promise that resolves with an array containing the results of all callbacks
   */
  callBatch: (
    ...args: Parameters<Callback>
  ) => Promise<Awaited<ReturnType<Callback>>[]>;
};

export type ModifyRspackConfigFn = (
  config: NarrowedRspackConfig,
  utils: ModifyRspackConfigUtils,
) => MaybePromise<Rspack.Configuration | void>;

export type ModifyWebpackChainUtils = ModifyChainUtils & {
  /** @ts-ignore `webpack` type only exists when `@rsbuild/webpack` is installed */
  webpack: typeof import('webpack');
  CHAIN_ID: ChainIdentifier;
  /**
   * @deprecated Use target instead.
   * */
  name: string;
  /**
   * @deprecated Use HtmlPlugin instead.
   */
  HtmlWebpackPlugin: typeof HtmlRspackPlugin;
};

export type ModifyWebpackConfigUtils = ModifyWebpackChainUtils & {
  addRules: (rules: RuleSetRule | RuleSetRule[]) => void;
  appendRules: (rules: RuleSetRule | RuleSetRule[]) => void;
  prependPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
  mergeConfig: RspackMerge;
};

export type ModifyWebpackChainFn = (
  chain: RspackChain,
  utils: ModifyWebpackChainUtils,
) => Promise<void> | void;

export type ModifyWebpackConfigFn = (
  config: WebpackConfig,
  utils: ModifyWebpackConfigUtils,
) => Promise<WebpackConfig | void> | WebpackConfig | void;

export type PluginMeta = {
  environment?: AddPluginsOptions['environment'];
  instance: RsbuildPlugin;
};

export type PluginManager = Pick<
  RsbuildInstance,
  'getPlugins' | 'addPlugins' | 'isPluginExists' | 'removePlugins'
> & {
  /** Get all plugins with environment info */
  getAllPluginsWithMeta: () => PluginMeta[];
};

export type RsbuildPluginApplyFn = (
  this: void,
  /**
   * The original Rsbuild configuration object (before plugin processing)
   */
  config: RsbuildConfig,
  context: Pick<RsbuildContext, 'action'>,
) => boolean;

export type RsbuildPluginApply = 'serve' | 'build' | RsbuildPluginApplyFn;

/**
 * The type of the Rsbuild plugin object.
 */
export type RsbuildPlugin = {
  /**
   * The name of the plugin, a unique identifier.
   */
  name: string;
  /**
   * Conditional apply the plugin during serve or build.
   * - `'serve'`: Apply the plugin when starting the dev server or preview server.
   * - `'build'`: Apply the plugin during build.
   * - Can be a function that returns `true` to apply the plugin or `false` to skip it.
   * - If not specified, the plugin will be applied during both serve and build.
   */
  apply?: RsbuildPluginApply;
  /**
   * The setup function of the plugin, which can be an async function.
   * This function is called once when the plugin is initialized.
   * @param api provides the context info, utility functions and lifecycle hooks.
   */
  setup: (api: RsbuildPluginAPI) => MaybePromise<void>;
  /**
   * Specifies the execution order of the plugin.
   * - `'pre'`: Execute the plugin before other plugins.
   * - `'post'`: Execute the plugin after other plugins.
   * - If not specified, the plugin will execute in the order they were registered.
   *
   * This affects the order in which hooks are registered, but if a hook specifies
   * an `order` property, the `order` takes higher precedence.
   */
  enforce?: 'pre' | 'post';
  /**
   * Declare the names of pre-plugins, which will be executed before the current plugin.
   * This has higher precedence than the `enforce` property.
   */
  pre?: string[];
  /**
   * Declare the names of post-plugins, which will be executed after the current plugin.
   * This has higher precedence than the `enforce` property.
   */
  post?: string[];
  /**
   * Declare the plugins that need to be removed, you can pass an array of plugin names.
   */
  remove?: string[];
};

// Support for registering lower version Rsbuild plugins in the new version of
// Rsbuild core without throwing type mismatches. In most cases, Rsbuild core
// only adds new methods or properties to the API object, which means that lower
// version plugins will usually work fine.
type LooseRsbuildPlugin = Omit<RsbuildPlugin, 'setup'> & {
  setup: (api: any) => MaybePromise<void>;
};

export type RsbuildPlugins = (
  | LooseRsbuildPlugin
  | Falsy
  | Promise<LooseRsbuildPlugin | Falsy | RsbuildPlugins>
  | RsbuildPlugins
)[];

export type GetRsbuildConfig = {
  (): Readonly<RsbuildConfig>;
  (type: 'original' | 'current'): Readonly<RsbuildConfig>;
  (type: 'normalized'): NormalizedConfig;
};

type PluginHook<T extends (...args: any[]) => any> = (
  options: T | HookDescriptor<T>,
) => void;

type TransformResult =
  | string
  | {
      code: string;
      map?: string | Rspack.sources.RawSourceMap | null;
    };

export type TransformContext = {
  /**
   * The code of the module.
   */
  code: string;
  /**
   * The directory path of the currently processed module,
   * which changes with the location of each processed module.
   */
  context: string | null;
  /**
   * The absolute path of the module, including the query.
   * @example '/home/user/project/src/index.js?foo=123'
   */
  resource: string;
  /**
   * The absolute path of the module, without the query.
   * @example '/home/user/project/src/index.js'
   */
  resourcePath: string;
  /**
   * The query of the module.
   * @example '?foo=123'
   */
  resourceQuery: string;
  /**
   * The environment context for current build.
   */
  environment: EnvironmentContext;
  /**
   * Add an additional file as the dependency.
   * The file will be watched and changes to the file will trigger rebuild.
   * @param file The absolute path of the module
   */
  addDependency: (file: string) => void;
  /**
   * Add a non-existing file as a dependency.
   * Similar to addDependency, but handles the creation of files during compilation before watchers are attached correctly.
   * The file will be watched and changes to the file will trigger rebuild.
   * @param file The absolute path of the module
   */
  addMissingDependency(file: string): void;
  /**
   * Add a directory as dependency.
   * The directory will be watched and changes to the directory will trigger rebuild.
   * @param context The absolute path of the directory
   */
  addContextDependency(context: string): void;
  /**
   * Emits a file to the build output.
   * @param name file name of the asset
   * @param content the source of the asset
   * @param sourceMap source map of the asset
   * @param assetInfo additional asset information
   */
  emitFile: Rspack.LoaderContext['emitFile'];
  /**
   * Compile and execute a module at the build time.
   */
  importModule: Rspack.LoaderContext['importModule'];
  /**
   * Resolve a module specifier.
   */
  resolve: Rspack.LoaderContext['resolve'];
};

export type TransformHandler = (
  context: TransformContext,
) => MaybePromise<TransformResult>;

export type TransformDescriptor = {
  /**
   * Include modules that match the test assertion, the same as `rule.test`
   * @see https://rspack.rs/config/module#ruletest
   */
  test?: Rspack.RuleSetCondition;
  /**
   * A condition that matches the resource query.
   * @see https://rspack.rs/config/module#ruleresourcequery
   */
  resourceQuery?: Rspack.RuleSetCondition;
  /**
   * Match based on the Rsbuild targets and only apply the transform to
   * certain targets.
   * @see https://rsbuild.rs/config/output/target
   */
  targets?: RsbuildTarget[];
  /**
   * Match based on the Rsbuild environment names and only apply the transform
   * to certain environments.
   * @see https://rsbuild.rs/config/environments
   */
  environments?: string[];
  /**
   * If raw is `true`, the transform handler will receive the Buffer type code
   * instead of the string type.
   * @see https://rspack.rs/api/loader-api/examples#raw-loader
   */
  raw?: boolean;
  /**
   * Marks the layer of the matching module, can be used to group a group of
   * modules into one layer
   * @see https://rspack.rs/config/module#rulelayer
   */
  layer?: string;
  /**
   * Matches all modules that match this resource, and will match against layer of
   * the module that issued the current module.
   * @see https://rspack.rs/config/module#ruleissuerlayer
   */
  issuerLayer?: string;
  /**
   * Matches all modules that match this resource, and will match against Resource
   * (the absolute path without query and fragment) of the module that issued the
   * current module.
   * @see https://rspack.rs/config/module#ruleissuer
   */
  issuer?: Rspack.RuleSetCondition;
  /**
   * Matches [import attributes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import/with)
   * @see https://rspack.rs/config/module#rulewith
   */
  with?: Record<string, Rspack.RuleSetCondition>;
  /**
   * Matches modules based on MIME type instead of file extension. It's primarily
   * useful for data URI module (like `data:text/javascript,...`).
   * @see https://rspack.rs/config/module#rulemimetype
   */
  mimetype?: Rspack.RuleSetCondition;
  /**
   * The original property for specifying execution order, now deprecated in favor of `order`.
   * @deprecated Use `order` instead.
   */
  enforce?: 'pre' | 'post';
  /**
   * Specifies the execution order of the transform function.
   * - When specified as 'pre', the transform function will execute before other
   * transform functions (or Rspack loaders).
   * - When specified as 'post', the transform function will execute after other
   * transform functions (or Rspack loaders).
   * @see https://rspack.rs/config/module#ruleenforce
   */
  order?: HookOrder;
};

export type TransformHook = (
  descriptor: TransformDescriptor,
  handler: TransformHandler,
) => void;

export type ProcessAssetsStage =
  | 'additional'
  | 'pre-process'
  | 'derived'
  | 'additions'
  | 'none'
  | 'optimize'
  | 'optimize-count'
  | 'optimize-compatibility'
  | 'optimize-size'
  | 'dev-tooling'
  | 'optimize-inline'
  | 'summarize'
  | 'optimize-hash'
  | 'optimize-transfer'
  | 'analyse'
  | 'report';

export type ProcessAssetsDescriptor = {
  /**
   * Specifies the order in which your asset processing logic should run relative to other plugins.
   */
  stage: ProcessAssetsStage;
  /**
   * Match based on the Rsbuild targets and only process the assets of certain targets.
   * @see https://rsbuild.rs/config/output/target
   */
  targets?: RsbuildTarget[];
  /**
   * Match based on the Rsbuild environment names and only process the assets of certain environments.
   * @see https://rsbuild.rs/config/environments
   */
  environments?: string[];
};

export type RspackSources = Pick<
  typeof Rspack.sources,
  | 'Source'
  | 'RawSource'
  | 'OriginalSource'
  | 'SourceMapSource'
  | 'CachedSource'
  | 'ConcatSource'
  | 'ReplaceSource'
  | 'PrefixSource'
  | 'SizeOnlySource'
  | 'CompatSource'
>;

export type ProcessAssetsHandler = (context: {
  assets: Record<string, Rspack.sources.Source>;
  compiler: Rspack.Compiler;
  compilation: Rspack.Compilation;
  /**
   * The environment context for current build.
   */
  environment: EnvironmentContext;
  /**
   * Contains multiple classes which represent an Rspack `Source`.
   */
  sources: RspackSources;
}) => Promise<void> | void;

export type ResolveHandler = (context: {
  /** Module request information */
  resolveData: Rspack.ResolveData;
  /** The environment context for current build. */
  environment: EnvironmentContext;
  compiler: Rspack.Compiler;
  compilation: Rspack.Compilation;
}) => Promise<void> | void;

export type ResolveHook = (handler: ResolveHandler) => void;

export type ProcessAssetsHook = (
  descriptor: ProcessAssetsDescriptor,
  handler: ProcessAssetsHandler,
) => void;

declare function getNormalizedConfig(): NormalizedConfig;
declare function getNormalizedConfig(options: {
  environment: string;
}): NormalizedEnvironmentConfig;

/**
 * Define a generic Rsbuild plugin API that provider can extend as needed.
 */
export type RsbuildPluginAPI = Readonly<{
  /**
   * A read-only object that provides some context information.
   */
  context: Readonly<RsbuildContext>;
  /**
   * Explicitly expose some properties or methods of the current plugin,
   * and other plugins can get these APIs through `api.useExposed`.
   */
  expose: <T = any>(id: string | symbol, api: T) => void;
  /**
   * Get the Rsbuild config, this method must be called after the
   * `modifyRsbuildConfig` hook is executed.
   */
  getRsbuildConfig: GetRsbuildConfig;
  /**
   * Get the all normalized Rsbuild config or the Rsbuild config of a specified
   * environment, this method must be called after the
   * `modifyRsbuildConfig` hook is executed.
   */
  getNormalizedConfig: typeof getNormalizedConfig;
  /**
   * A logger instance used to output log information in a unified format.
   * Use this instead of `console.log` to maintain consistent logging with Rsbuild.
   * Equivalent to `import { logger } from '@rsbuild/core'`.
   */
  logger: Logger;
  /**
   * Determines if a plugin has been registered in the current Rsbuild instance.
   */
  isPluginExists: (
    pluginName: string,
    options?: {
      /**
       * Whether it exists in the specified environment.
       * If environment is not specified, determine whether the plugin is a global plugin.
       */
      environment: string;
    },
  ) => boolean;
  /**
   * Allows you to modify the Rspack configuration using the `rspack-chain` API,
   * providing the same functionality as `tools.bundlerChain`.
   */
  modifyBundlerChain: PluginHook<ModifyBundlerChainFn>;
  /**
   * Modify the Rsbuild configuration of a specific environment.
   */
  modifyEnvironmentConfig: PluginHook<ModifyEnvironmentConfigFn>;
  /**
   * Modify the final HTML content. The hook receives a HTML string
   * and a context object, and you can return a new HTML string to
   * replace the original one. This hook is triggered after the
   * `modifyHTMLTags` hook.
   */
  modifyHTML: PluginHook<ModifyHTMLFn>;
  /**
   * Modify the tags that are injected into the HTML.
   * This hook is triggered before the `modifyHTML` hook.
   */
  modifyHTMLTags: PluginHook<ModifyHTMLTagsFn>;
  /**
   * To modify the Rspack config, you can directly modify the config object,
   * or return a new object to replace the previous object.
   */
  modifyRspackConfig: PluginHook<ModifyRspackConfigFn>;
  /**
   * Modify the config passed to the Rsbuild, you can directly modify the config object,
   * or return a new object to replace the previous object.
   */
  modifyRsbuildConfig: PluginHook<ModifyRsbuildConfigFn>;
  /**
   * Allows you to modify the webpack configuration using the `rspack-chain` API,
   * providing the same functionality as `tools.bundlerChain`.
   */
  modifyWebpackChain: PluginHook<ModifyWebpackChainFn>;
  /**
   * To modify the webpack config, you can directly modify the config object,
   * or return a new object to replace the previous object.
   */
  modifyWebpackConfig: PluginHook<ModifyWebpackConfigFn>;
  /**
   * A callback function that is triggered after running the production build.
   * You can access the build result information via the
   * [stats](https://rspack.rs/api/javascript-api/stats) parameter.
   */
  onAfterBuild: PluginHook<OnAfterBuildFn>;
  /**
   * A callback function that is triggered after the compiler instance has been
   * created, but before the build process. This hook is called when you run
   * `rsbuild.startDevServer`, `rsbuild.build`, or `rsbuild.createCompiler`.
   */
  onAfterCreateCompiler: PluginHook<OnAfterCreateCompilerFn>;
  /**
   * A callback function that is triggered after the compilation of a single environment.
   * You can access the build result information via the
   * [stats](https://rspack.rs/api/javascript-api/stats) parameter.
   */
  onAfterEnvironmentCompile: PluginHook<OnAfterEnvironmentCompileFn>;
  /**
   * Called after starting the dev server, you can get the port number with the
   * `port` parameter, and the page routes info with the `routes` parameter.
   */
  onAfterStartDevServer: PluginHook<OnAfterStartDevServerFn>;
  /**
   * Called after starting the production preview server, you can get the port
   * number with the `port` parameter, and the page routes info with the
   * `routes` parameter.
   */
  onAfterStartProdServer: PluginHook<OnAfterStartProdServerFn>;
  /**
   * A callback function that is triggered before the production build is executed.
   */
  onBeforeBuild: PluginHook<OnBeforeBuildFn>;
  /**
   * A callback function that is triggered after the Compiler instance has been
   * created, but before the build process begins. This hook is called when you
   * run `rsbuild.startDevServer`, `rsbuild.build`, or `rsbuild.createCompiler`.
   */
  onBeforeCreateCompiler: PluginHook<OnBeforeCreateCompilerFn>;
  /**
   * A callback function that is triggered before the compilation of a single environment.
   */
  onBeforeEnvironmentCompile: PluginHook<OnBeforeEnvironmentCompileFn>;
  /**
   * Called before starting the dev server.
   */
  onBeforeStartDevServer: PluginHook<OnBeforeStartDevServerFn>;
  /**
   * Called before starting the production preview server.
   */
  onBeforeStartProdServer: PluginHook<OnBeforeStartProdServerFn>;
  /**
   * Called when closing the build instance. Can be used to perform cleanup
   * operations when the building is closed.
   */
  onCloseBuild: PluginHook<OnCloseBuildFn>;
  /**
   * Called when closing the dev server. Can be used to perform cleanup
   * operations when the dev server is closed.
   */
  onCloseDevServer: PluginHook<OnCloseDevServerFn>;
  /**
   * Called after each development mode build, you can use `isFirstCompile`
   * to determine whether it is the first build.
   */
  onDevCompileDone: PluginHook<OnDevCompileDoneFn>;
  /**
   * Called when the process is going to exit, this hook can only execute
   * synchronous code.
   */
  onExit: PluginHook<OnExitFn>;
  /**
   * Modify assets before emitting, the same as Rspack's
   * [compilation.hooks.processAssets](https://rspack.rs/api/plugin-api/compilation-hooks#processassets) hook.
   */
  processAssets: ProcessAssetsHook;
  /**
   * Intercept and modify module request information before module resolution begins.
   * The same as Rspack's [normalModuleFactory.hooks.resolve](https://rspack.rs/api/plugin-api/normal-module-factory-hooks#resolve) hook.
   */
  resolve: ResolveHook;
  /**
   * A simplified wrapper around Rspack loaders, `api.transform` lets you
   * easily transform the code of specific modules during the build process.
   * You can match files by module path, query, or other conditions, and
   * apply custom transformations to their contents.
   */
  transform: TransformHook;
  /**
   * Get the properties or methods exposed by other plugins.
   */
  useExposed: <T = any>(id: string | symbol) => T | undefined;
}>;
