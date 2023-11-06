import type {
  ArrayOrNot,
  ChainedConfig,
  FileFilterUtil,
  ChainedConfigWithUtils,
} from '../utils';
import type {
  AutoprefixerOptions,
  SassLoaderOptions,
  LessLoaderOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  CSSLoaderOptions,
  StyleLoaderOptions,
} from '../thirdParty';
import type { BundlerChain } from '../bundlerConfig';
import type { ModifyBundlerChainUtils, ModifyChainUtils } from '../hooks';
import type { DevServerHttpsOptions } from './dev';
import type { RspackConfig, RspackRule, RspackPluginInstance } from '../rspack';
import type { Options as HTMLPluginOptions } from 'html-webpack-plugin';

export type { HTMLPluginOptions };

export type DevServerOptions = {
  /** config of hmr client. */
  client?: {
    path?: string;
    port?: string;
    host?: string;
    protocol?: string;
  };
  /** Whether to enable gzip compression */
  compress?: boolean;
  devMiddleware?: {
    writeToDisk?: boolean | ((filename: string) => boolean);
    outputFileSystem?: Record<string, any>;
  };
  headers?: Record<string, string | string[]>;
  /** Provides the ability to execute a custom function and apply custom middlewares */
  /** Whether to watch files change. */
  watch?: boolean;
  /** Whether to enable hot reload. */
  hot?: boolean | string;
  /** Whether to enable page reload. */
  liveReload?: boolean;
  /** Whether to enable https. */
  https?: DevServerHttpsOptions;
  /** see https://github.com/bripkens/connect-history-api-fallback */
  historyApiFallback?:
    | boolean
    | {
        index?: string;
        verbose?: boolean;
        logger?: typeof console.log;
        htmlAcceptHeaders?: string[];
        disableDotRule?: true;
        rewrites?: Array<{
          from: RegExp;
          to: string | RegExp | Function;
        }>;
      };
  [propName: string]: any;
};

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;

export type ToolsAutoprefixerConfig = ChainedConfig<AutoprefixerOptions>;

export type ToolsSassConfig = ChainedConfigWithUtils<
  SassLoaderOptions,
  { addExcludes: FileFilterUtil }
>;

export type ToolsLessConfig = ChainedConfigWithUtils<
  LessLoaderOptions,
  { addExcludes: FileFilterUtil }
>;

export type ToolsBundlerChainConfig = ArrayOrNot<
  (chain: BundlerChain, utils: ModifyBundlerChainUtils) => void
>;

export type ToolsPostCSSLoaderConfig = ChainedConfigWithUtils<
  PostCSSLoaderOptions,
  { addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void }
>;

export type ToolsCSSLoaderConfig = ChainedConfig<CSSLoaderOptions>;

export type ToolsStyleLoaderConfig = ChainedConfig<StyleLoaderOptions>;

export type ToolsHtmlPluginConfig = ChainedConfigWithUtils<
  HTMLPluginOptions,
  {
    entryName: string;
    entryValue: string | string[];
  }
>;

export type ModifyRspackConfigUtils = ModifyChainUtils & {
  addRules: (rules: RspackRule | RspackRule[]) => void;
  prependPlugins: (
    plugins: RspackPluginInstance | RspackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: RspackPluginInstance | RspackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
  mergeConfig: typeof import('../../../compiled/webpack-merge').merge;
  rspack: typeof import('@rspack/core');
};

export type ToolsRspackConfig = ChainedConfigWithUtils<
  RspackConfig,
  ModifyRspackConfigUtils
>;

export interface ToolsConfig {
  /**
   * Modify the config of [sass-loader](https://github.com/webpack-contrib/sass-loader).
   */
  sass?: ToolsSassConfig;
  /**
   * Modify the config of [less-loader](https://github.com/webpack-contrib/less-loader).
   */
  less?: ToolsLessConfig;
  /**
   * Configure bundler config base on [webpack-chain](https://github.com/neutrinojs/webpack-chain)
   */
  bundlerChain?: ToolsBundlerChainConfig;
  /**
   * Modify the config of [autoprefixer](https://github.com/postcss/autoprefixer)
   */
  autoprefixer?: ToolsAutoprefixerConfig;
  /**
   * Modify the options of DevServer.
   */
  devServer?: ToolsDevServerConfig;
  /**
   * Modify the options of [css-loader](https://github.com/webpack-contrib/css-loader).
   */
  cssLoader?: ToolsCSSLoaderConfig;
  /**
   * Modify the options of [postcss-loader](https://github.com/webpack-contrib/postcss-loader).
   */
  postcss?: ToolsPostCSSLoaderConfig;
  /**
   * Modify the options of [style-loader](https://github.com/webpack-contrib/style-loader).
   */
  styleLoader?: ToolsStyleLoaderConfig;
  /**
   * Configure the html-webpack-plugin.
   */
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  /**
   * Configure Rspack.
   */
  rspack?: ToolsRspackConfig;
}

export type NormalizedToolsConfig = ToolsConfig;
