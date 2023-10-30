import type {
  ArrayOrNot,
  ChainedConfig,
  FileFilterUtil,
  SharedToolsConfig,
  ToolsLessConfig,
  ToolsSassConfig,
  TerserPluginOptions,
} from '@rsbuild/shared';
import type {
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../hooks';
import type {
  CSSExtractOptions,
  HTMLPluginOptions,
  TSLoaderOptions,
  WebpackChain,
  WebpackConfig,
} from '../thirdParty';
import type { NormalizedCSSExtractOptions } from '../thirdParty/css';

export type ToolsTerserConfig = ChainedConfig<TerserPluginOptions>;

export type ToolsTSLoaderConfig = ChainedConfig<
  TSLoaderOptions,
  { addIncludes: FileFilterUtil; addExcludes: FileFilterUtil }
>;

export type ToolsCssExtractConfig =
  | CSSExtractOptions
  | ((options: CSSExtractOptions) => CSSExtractOptions | void);

export type ToolsHtmlPluginConfig = ChainedConfig<
  HTMLPluginOptions,
  {
    entryName: string;
    entryValue: WebpackConfig['entry'];
  }
>;

export type ToolsWebpackConfig = ChainedConfig<
  WebpackConfig,
  ModifyWebpackConfigUtils
>;

export type ToolsWebpackChainConfig = ArrayOrNot<
  (chain: WebpackChain, utils: ModifyWebpackChainUtils) => void
>;

export interface ToolsConfig extends SharedToolsConfig {
  /**
  /**
   * Modify the config of [sass-loader](https://github.com/webpack-contrib/sass-loader).
   */
  sass?: ToolsSassConfig;
  /**
   * Modify the config of [less-loader](https://github.com/webpack-contrib/less-loader).
   */
  less?: ToolsLessConfig;
  /**
   * Modify the options of [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin).
   */
  terser?: ToolsTerserConfig;
  /**
   * Modify the options of [ts-loader](https://github.com/TypeStrong/ts-loader).
   * When `tools.tsLoader` is not undefined, Rsbuild will use ts-loader instead of babel-loader to compile TypeScript code.
   */
  tsLoader?: ToolsTSLoaderConfig;
  /**
   * Modify the options of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
   */
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  /**
   * Modify the options of [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin).
   */
  cssExtract?: CSSExtractOptions;
  /**
   * Configure [webpack](https://webpack.js.org/).
   */
  webpack?: ToolsWebpackConfig;
  /**
   * Configure webpack by [webpack-chain](https://github.com/neutrinojs/webpack-chain).
   */
  webpackChain?: ToolsWebpackChainConfig;
}

export interface NormalizedToolsConfig extends ToolsConfig {
  cssExtract: NormalizedCSSExtractOptions;
}
