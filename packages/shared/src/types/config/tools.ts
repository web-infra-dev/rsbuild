import type { rspack } from '@rspack/core';
import type { SwcLoaderOptions } from '@rspack/core';
import type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
import type {
  ConfigChain,
  ConfigChainAsyncWithContext,
  ConfigChainWithContext,
} from '../../reduceConfigs';
import type { BundlerChain } from '../bundlerConfig';
import type { BundlerPluginInstance } from '../bundlerConfig';
import type { ModifyBundlerChainUtils, ModifyChainUtils } from '../hooks';
import type {
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../plugin';
import type { Rspack, RspackConfig, RspackRule } from '../rspack';
import type {
  AutoprefixerOptions,
  CSSExtractOptions,
  CSSLoaderOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  StyleLoaderOptions,
  WebpackConfig,
} from '../thirdParty';
import type { MaybePromise, OneOrMany, WebpackChain } from '../utils';

export type { HTMLPluginOptions };

export type ToolsSwcConfig = ConfigChain<SwcLoaderOptions>;

export type ToolsAutoprefixerConfig = ConfigChain<AutoprefixerOptions>;

export type ToolsBundlerChainConfig = OneOrMany<
  (chain: BundlerChain, utils: ModifyBundlerChainUtils) => MaybePromise<void>
>;

export type ToolsPostCSSLoaderConfig = ConfigChainWithContext<
  PostCSSLoaderOptions,
  { addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void }
>;

export type ToolsCSSLoaderConfig = ConfigChain<CSSLoaderOptions>;

export type ToolsStyleLoaderConfig = ConfigChain<StyleLoaderOptions>;

export type ToolsHtmlPluginConfig = ConfigChainWithContext<
  HTMLPluginOptions,
  {
    entryName: string;
    entryValue: (string | string[] | Rspack.EntryDescription)[];
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

export type ToolsRspackConfig = ConfigChainAsyncWithContext<
  RspackConfig,
  ModifyRspackConfigUtils
>;

export type ToolsWebpackConfig = ConfigChainWithContext<
  WebpackConfig,
  ModifyWebpackConfigUtils
>;

export type ToolsWebpackChainConfig = OneOrMany<
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
