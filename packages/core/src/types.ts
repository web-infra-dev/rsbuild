import type {
  BuildOptions,
  Bundler,
  CreateCompiler,
  CreateDevServerOptions,
  InspectConfigOptions,
  InspectConfigResult,
  NormalizedConfig,
  PluginManager,
  PreviewServerOptions,
  RsbuildConfig,
  RsbuildContext,
  RsbuildPlugin,
  RsbuildPluginAPI,
  RsbuildPlugins,
  RspackConfig,
  StartDevServerOptions,
  TransformHandler,
  WebpackConfig,
} from '@rsbuild/shared';
import type { Hooks } from './initHooks';
import type { RsbuildDevServer } from './server/devServer';
import type { StartServerResult } from './server/helper';

declare module '@rspack/core' {
  interface Compiler {
    __rsbuildTransformer?: Record<string, TransformHandler>;
  }
}

export type RspackSourceMap = {
  version: number;
  sources: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
  sourcesContent?: string[];
  names?: string[];
};

export type { RsbuildPlugin, RsbuildPlugins, RsbuildPluginAPI };

/** The inner context. */
export type InternalContext = RsbuildContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current Rsbuild config. */
  config: Readonly<RsbuildConfig>;
  /** The original Rsbuild config passed from the createRsbuild method. */
  originalConfig: Readonly<RsbuildConfig>;
  /** The normalized Rsbuild config. */
  normalizedConfig?: NormalizedConfig;
  /** The plugin API. */
  pluginAPI?: RsbuildPluginAPI;
};

export type CreateRsbuildOptions = {
  /** The root path of current project. */
  cwd?: string;
  /** Configurations of Rsbuild. */
  rsbuildConfig?: RsbuildConfig;
};

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

  build: (options?: BuildOptions) => Promise<void>;

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
    rsbuildOptions: Required<CreateRsbuildOptions>;
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

  getHTMLPaths: RsbuildPluginAPI['getHTMLPaths'];
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

export type {
  RsbuildConfig,
  NormalizedConfig,
  DevConfig,
  HtmlConfig,
  ToolsConfig,
  SourceConfig,
  ServerConfig,
  OutputConfig,
  SecurityConfig,
  PerformanceConfig,
  ModuleFederationConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedToolsConfig,
  NormalizedSourceConfig,
  NormalizedServerConfig,
  NormalizedOutputConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
  NormalizedModuleFederationConfig,
} from '@rsbuild/shared';
