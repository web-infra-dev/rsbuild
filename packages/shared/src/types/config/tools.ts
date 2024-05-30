import type { rspack } from '@rspack/core';
import type { SwcLoaderOptions } from '@rspack/core';
import type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
import type { BundlerChain } from '../bundlerConfig';
import type { BundlerPluginInstance } from '../bundlerConfig';
import type { ModifyBundlerChainUtils, ModifyChainUtils } from '../hooks';
import type {
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../plugin';
import type { RspackConfig, RspackRule } from '../rspack';
import type {
  AutoprefixerOptions,
  CSSExtractOptions,
  CSSLoaderOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  StyleLoaderOptions,
  WebpackConfig,
} from '../thirdParty';
import type {
  ArrayOrNot,
  ChainedConfig,
  ChainedConfigWithUtils,
  WebpackChain,
} from '../utils';

export type { HTMLPluginOptions };

export type ToolsSwcConfig = ChainedConfig<SwcLoaderOptions>;

export type ToolsAutoprefixerConfig = ChainedConfig<AutoprefixerOptions>;

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
  mergeConfig: typeof import('../../../compiled/webpack-merge/index.js').merge;
  rspack: typeof rspack;
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
   * Modify the options of [CssExtractRspackPlugin](https://rspack.dev/plugins/rspack/css-extract-rspack-plugin).
   */
  cssExtract?: CSSExtractOptions;
  /**
   * Configure Rspack.
   * @requires rspack
   */
  rspack?: ToolsRspackConfig;
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
