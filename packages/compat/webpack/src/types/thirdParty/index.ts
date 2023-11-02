import type { WebpackChain } from '@rsbuild/shared';
import type webpack from 'webpack';
import type { Configuration as WebpackConfig } from 'webpack';
import type { Options as RawTSLoaderOptions } from 'ts-loader';

export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
export type { SubresourceIntegrityPluginOptions as SubresourceIntegrityOptions } from 'webpack-subresource-integrity';

export type TSLoaderOptions = Partial<RawTSLoaderOptions>;

export type { webpack, WebpackChain, WebpackConfig };

export type {
  CSSExtractOptions,
  MiniCSSExtractPluginOptions,
  MiniCSSExtractLoaderOptions,
} from './css';
