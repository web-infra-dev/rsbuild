import type { ArrayOrNot, ChainedConfig, FileFilterUtil } from '../utils';
import { BabelConfigUtils, BabelTransformOptions } from '../../babel';
import type {
  AutoprefixerOptions,
  SassLoaderOptions,
  LessLoaderOptions,
  PugOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  CSSLoaderOptions,
  StyleLoaderOptions,
  CssMinimizerPluginOptions,
} from '../thirdParty';
import type { BundlerChain } from '../bundlerConfig';
import type { ModifyBundlerChainUtils } from '../hooks';
import type { DevServerHttpsOptions } from './dev';

/** html-rspack-plugin is compatible with html-webpack-plugin */
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';

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

export type ToolsSassConfig = ChainedConfig<
  SassLoaderOptions,
  { addExcludes: FileFilterUtil }
>;

export type ToolsLessConfig = ChainedConfig<
  LessLoaderOptions,
  { addExcludes: FileFilterUtil }
>;

export type ToolsBundlerChainConfig = ArrayOrNot<
  (chain: BundlerChain, utils: ModifyBundlerChainUtils) => void
>;

export type ToolsBabelConfig = ChainedConfig<
  BabelTransformOptions,
  BabelConfigUtils
>;

export type ToolsPugConfig = true | ChainedConfig<PugOptions>;

export type ToolsPostCSSLoaderConfig = ChainedConfig<
  PostCSSLoaderOptions,
  { addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void }
>;

export type ToolsCSSLoaderConfig = ChainedConfig<CSSLoaderOptions>;

export type ToolsStyleLoaderConfig = ChainedConfig<StyleLoaderOptions>;

export type ToolsMinifyCssConfig = ChainedConfig<CssMinimizerPluginOptions>;

export interface SharedToolsConfig {
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
   * Modify the options of [babel-loader](https://github.com/babel/babel-loader)
   *
   * When `tools.babel`'s type is Function，the default babel config will be passed in as the first parameter, the config object can be modified directly, or a value can be returned as the final result.
   *
   * When `tools.babel`'s type is `Object`, the config will be shallow merged with default config by `Object.assign`.
   *
   * Note that `Object.assign` is a shallow copy and will completely overwrite the built-in `presets` or `plugins` array, please use it with caution.
   */
  babel?: ToolsBabelConfig;

  /**
   * Modify the options of [css-loader](https://github.com/webpack-contrib/css-loader).
   */
  cssLoader?: ToolsCSSLoaderConfig;

  /**
   * Modify the options of [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin).
   */
  minifyCss?: ToolsMinifyCssConfig;

  /**
   * Modify the options of [postcss-loader](https://github.com/webpack-contrib/postcss-loader).
   */
  postcss?: ToolsPostCSSLoaderConfig;

  /**
   * Configure the [Pug](https://pugjs.org/) template engine.
   */
  pug?: ToolsPugConfig;

  /**
   * Modify the options of [style-loader](https://github.com/webpack-contrib/style-loader).
   */
  styleLoader?: ToolsStyleLoaderConfig;
}

export type NormalizedSharedToolsConfig = SharedToolsConfig;
