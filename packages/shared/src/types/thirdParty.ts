import type {
  Options as SassOptions,
  LegacyOptions as LegacySassOptions,
} from '../../compiled/sass';
import type * as SassLoader from '../../compiled/sass-loader';
import type Less from '../../compiled/less';
import type { LoaderContext } from '@rspack/core';
import type TerserPlugin from 'terser-webpack-plugin';
import type { AcceptedPlugin, ProcessOptions } from 'postcss';
import type { Configuration as WebpackConfig } from 'webpack';
import type {
  PluginOptions as MiniCSSExtractPluginOptions,
  LoaderOptions as MiniCSSExtractLoaderOptions,
} from 'mini-css-extract-plugin';
import type { Options as AutoprefixerOptions } from '../../compiled/autoprefixer';

export interface CSSExtractOptions {
  pluginOptions?: MiniCSSExtractPluginOptions;
  loaderOptions?: MiniCSSExtractLoaderOptions;
}

export type { WebpackConfig, AutoprefixerOptions };

export type TerserPluginOptions = TerserPlugin.BasePluginOptions &
  TerserPlugin.DefinedDefaultMinimizerAndOptions<TerserPlugin.TerserOptions>;

export type SassLoaderOptions = Omit<SassLoader.Options, 'sassOptions'> &
  (
    | {
        api?: 'legacy';
        sassOptions?: Partial<LegacySassOptions<'async'>>;
      }
    | {
        api: 'modern';
        sassOptions?: SassOptions<'async'>;
      }
  );

export type LessLoaderOptions = {
  lessOptions?: Less.Options;
  additionalData?:
    | string
    | ((
        content: string,
        loaderContext: LoaderContext<LessLoaderOptions>,
      ) => string | Promise<string>);
  sourceMap?: boolean;
  webpackImporter?: boolean;
  implementation?: unknown;
};

export type PostCSSOptions = ProcessOptions & {
  config?: boolean;
  plugins?: AcceptedPlugin[];
};

export type PostCSSLoaderOptions = {
  /**
   * Enable PostCSS Parser support in CSS-in-JS. If you use JS styles the postcss-js parser, add the execute option.
   */
  execute?: boolean;
  /**
   * By default generation of source maps depends on the devtool option. All values enable source map generation except eval and false value.
   */
  sourceMap?: boolean;
  /**
   * The special implementation option determines which implementation of PostCSS to use.
   */
  implementation?: unknown;
  /**
   * Allows to set PostCSS options and plugins.
   */
  postcssOptions?: PostCSSOptions;
};

export type { AcceptedPlugin as PostCSSPlugin } from 'postcss';

export interface CSSModulesOptions {
  compileType?: string;
  mode?: string;
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);
  exportGlobals?: boolean;
  localIdentName?: string;
  localIdentContext?: string;
  localIdentHashPrefix?: string;
  namedExport?: boolean;
  exportLocalsConvention?: string;
  exportOnlyLocals?: boolean;
}

export interface CSSLoaderOptions {
  url?: boolean | ((url: string, resourcePath: string) => boolean);
  import?:
    | boolean
    | ((url: string, media: string, resourcePath: string) => boolean);
  modules?: boolean | string | CSSModulesOptions;
  sourceMap?: boolean;
  importLoaders?: number;
  esModule?: boolean;
}

export type StyleLoaderInjectType =
  | 'styleTag'
  | 'singletonStyleTag'
  | 'lazyStyleTag'
  | 'lazySingletonStyleTag'
  | 'linkTag';

export interface StyleLoaderOptions {
  injectType?: StyleLoaderInjectType;
  attributes?: Record<string, string>;
  insert?: string | ((element: HTMLElement) => void);
}
