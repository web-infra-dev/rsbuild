import type { rspack } from '@rspack/core';
import type { SwcLoaderOptions } from '@rspack/core';
import type RspackChain from 'rspack-chain';
import type { ModifyBundlerChainUtils, ModifyChainUtils } from '../hooks';
import type {
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../plugin';
import type {
  BundlerPluginInstance,
  Rspack,
  RspackConfig,
  RspackRule,
} from '../rspack';
import type { HtmlRspackPlugin } from '../thirdParty';
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
  ConfigChain,
  ConfigChainAsyncWithContext,
  ConfigChainWithContext,
} from '../utils';
import type { MaybePromise, OneOrMany } from '../utils';

export type ToolsSwcConfig = ConfigChain<SwcLoaderOptions>;

export type ToolsAutoprefixerConfig = ConfigChain<AutoprefixerOptions>;

export type ToolsBundlerChainConfig = OneOrMany<
  (chain: RspackChain, utils: ModifyBundlerChainUtils) => MaybePromise<void>
>;

export type ToolsPostCSSLoaderConfig = ConfigChainWithContext<
  PostCSSLoaderOptions,
  { addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void }
>;

export type ToolsCSSLoaderConfig = ConfigChain<CSSLoaderOptions>;

export type ToolsStyleLoaderConfig = ConfigChain<StyleLoaderOptions>;

export type ToolsHtmlPluginConfig = ConfigChainWithContext<
  HtmlRspackPlugin.Options,
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
  mergeConfig: typeof import('webpack-merge').merge;
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
  (chain: RspackChain, utils: ModifyWebpackChainUtils) => void
>;

export interface ToolsConfig {
  /**
   * Configure bundler config base on [rspack-chain](https://github.com/rspack-contrib/rspack-chain)
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
   * Configure the html-rspack-plugin.
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
   * Configure webpack by [rspack-chain](https://github.com/rspack-contrib/rspack-chain).
   * @requires webpack
   */
  webpackChain?: ToolsWebpackChainConfig;
}

export type NormalizedToolsConfig = ToolsConfig & {
  cssExtract: Required<CSSExtractOptions>;
};
