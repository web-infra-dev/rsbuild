import type { WebpackChain } from '@rsbuild/shared';
import type webpack from 'webpack';
import type { Configuration as WebpackConfig } from 'webpack';
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
export type { webpack, WebpackChain, WebpackConfig };
export type {
  CSSExtractOptions,
  MiniCSSExtractPluginOptions,
  MiniCSSExtractLoaderOptions,
} from './css';
