import type {
  NodeEnv,
  MetaOptions,
  ScriptInject,
  RsbuildTarget,
  ChainedConfig,
  ChainedConfigWithUtils,
} from '@rsbuild/shared';
import type { RsbuildConfig as RsbuildRspackConfig } from '@rsbuild/core/rspack-provider';
import type { RsbuildConfig as RsbuildWebpackConfig } from '@rsbuild/webpack';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import type { LazyCompilationOptions } from './webpack/plugins/lazyCompilation';
import type { PluginRemOptions } from '@rsbuild/plugin-rem';

export type CreateWebpackBuilderOptions = {
  bundlerType: 'webpack';
  config: UniBuilderWebpackConfig;
};

export type CreateRspackBuilderOptions = {
  bundlerType: 'rspack';
  config: UniBuilderRspackConfig;
};

export type CreateUniBuilderOptions =
  | CreateWebpackBuilderOptions
  | CreateRspackBuilderOptions;

export type RsbuildConfig<B = 'rspack'> = B extends 'rspack'
  ? RsbuildRspackConfig
  : RsbuildWebpackConfig;

export type GlobalVars = Record<string, any>;

export type ChainedGlobalVars = ChainedConfigWithUtils<
  GlobalVars,
  {
    env: NodeEnv;
    target: RsbuildTarget;
  }
>;

export type ModuleScopes = Array<string | RegExp>;

export type UniBuilderExtraConfig = {
  source?: {
    /**
     * Define global variables. It can replace expressions like `process.env.FOO` in your code after compile.
     */
    globalVars?: ChainedGlobalVars;
    /**
     * Restrict importing paths. After configuring this option, all source files can only import code from
     * the specific paths, and import code from other paths is not allowed.
     */
    moduleScopes?: ChainedConfig<ModuleScopes>;
  };
  output?: {
    /**
     * @deprecated use `output.cssModules.localIdentName` instead
     */
    cssModuleLocalIdentName?: string;
    /**
     * Whether to generate a manifest file that contains information of all assets.
     */
    enableAssetManifest?: boolean;
    /**
     * Configure the retry of assets.
     */
    assetsRetry?: PluginAssetsRetryOptions;
    /**
     * Controls whether to the inline the runtime chunk to HTML.
     */
    disableInlineRuntimeChunk?: boolean;
    /**
     * Convert px to rem in CSS.
     */
    convertToRem?: boolean | PluginRemOptions;
    /**
     * Whether to treat all .css files in the source directory as CSS Modules.
     */
    disableCssModuleExtension?: boolean;
    /**
     * If this option is enabled, all unrecognized files will be emitted to the dist directory.
     * Otherwise, an exception will be thrown.
     */
    enableAssetFallback?: boolean;
  };
  html?: {
    /**
     * @deprecated use `html.meta` instead
     */
    metaByEntries?: Record<string, MetaOptions>;
    /**
     * @deprecated use `html.title` instead
     */
    titleByEntries?: Record<string, string>;
    /**
     * @deprecated use `html.favicon` instead
     */
    faviconByEntries?: Record<string, string | undefined>;
    /**
     * @deprecated use `html.inject` instead
     */
    injectByEntries?: Record<string, ScriptInject>;
    /**
     * @deprecated use `html.template` instead
     */
    templateByEntries?: Partial<Record<string, string>>;
    /**
     * @deprecated use `html.templateParameters` instead
     */
    templateParametersByEntries?: Record<string, Record<string, unknown>>;
  };
};

export type SriOptions = {
  hashFuncNames?: [string, ...string[]];
  enabled?: 'auto' | true | false;
  hashLoading?: 'eager' | 'lazy';
};

export type UniBuilderWebpackConfig = RsbuildWebpackConfig &
  UniBuilderExtraConfig & {
    security?: {
      /**
       * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to
       * verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.
       */
      sri?: SriOptions | boolean;
    };
    experiments?: {
      lazyCompilation?: LazyCompilationOptions;
    };
  };

export type UniBuilderRspackConfig = RsbuildRspackConfig &
  UniBuilderExtraConfig;

export type BuilderConfig<B = 'rspack'> = B extends 'rspack'
  ? UniBuilderRspackConfig
  : UniBuilderWebpackConfig;
