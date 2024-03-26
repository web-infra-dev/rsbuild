import type {
  ArrayOrNot,
  WebpackChain,
  ChainedConfig,
  FileFilterUtil,
  ChainedConfigWithUtils,
} from '../utils';
import type {
  WebpackConfig,
  PostCSSPlugin,
  CSSLoaderOptions,
  SassLoaderOptions,
  LessLoaderOptions,
  CSSExtractOptions,
  StyleLoaderOptions,
  AutoprefixerOptions,
  PostCSSLoaderOptions,
} from '../thirdParty';
import type { BundlerChain } from '../bundlerConfig';
import type { ModifyBundlerChainUtils, ModifyChainUtils } from '../hooks';
import type {
  RspackRule,
  RspackConfig,
  BuiltinSwcLoaderOptions,
} from '../rspack';
import type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
import type { BundlerPluginInstance } from '../bundlerConfig';
import type {
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../plugin';

export type { HTMLPluginOptions };

export type ToolsSwcConfig = ChainedConfig<BuiltinSwcLoaderOptions>;

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
    plugins: BundlerPluginInstance | BundlerPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: BundlerPluginInstance | BundlerPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
  mergeConfig: typeof import('../../../compiled/webpack-merge').merge;
  rspack: typeof import('@rspack/core');
};

export type ToolsRspackConfig = ChainedConfigWithUtils<
  RspackConfig,
  ModifyRspackConfigUtils
>;

export type ToolsWebpackConfig = ChainedConfigWithUtils<
  WebpackConfig,
  ModifyWebpackConfigUtils
>;

export type ToolsWebpackChainConfig = ArrayOrNot<
  (chain: WebpackChain, utils: ModifyWebpackChainUtils) => void
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
  htmlPlugin?: boolean | ToolsHtmlPluginConfig;
  /**
   * Configure the `builtin:swc-loader` of Rspack.
   */
  swc?: ToolsSwcConfig;
  /**
   * Configure Rspack.
   * @requires rspack
   */
  rspack?: ToolsRspackConfig;
  /**
   * Modify the options of [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin).
   * @requires webpack
   */
  cssExtract?: CSSExtractOptions;
  /**
   * Configure [webpack](https://webpack.js.org/).
   * @requires webpack
   */
  webpack?: ToolsWebpackConfig;
  /**
   * Configure webpack by [webpack-chain](https://github.com/neutrinojs/webpack-chain).
   * @requires webpack
   */
  webpackChain?: ToolsWebpackChainConfig;
}

export type NormalizedToolsConfig = ToolsConfig & {
  cssExtract: Required<CSSExtractOptions>;
};
