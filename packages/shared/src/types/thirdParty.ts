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
  /**
   * Allow to enable/disables handling the CSS functions url and image-set.
   * If set to false, css-loader will not parse any paths specified in url or image-set
   *
   * @default true
   */
  url?: boolean | ((url: string, resourcePath: string) => boolean);
  /**
   * Allows to enables/disables @import at-rules handling.
   *
   * @default true
   */
  import?:
    | boolean
    | ((url: string, media: string, resourcePath: string) => boolean);
  /**
   * Allows to enable/disable CSS Modules or ICSS and setup configuration:
   */
  modules?: boolean | string | CSSModulesOptions;
  /**
   * By default generation of source maps depends on the devtool option.
   */
  sourceMap?: boolean;
  /**
   * Allows to enables/disables or setups number of loaders applied before CSS loader for @import at-rules,
   * CSS modules and ICSS imports, i.e. @import/composes/@value value from './values.css'/etc.
   *
   * @default 0
   */
  importLoaders?: number;
  /**
   * By default, css-loader generates JS modules that use the ES modules syntax.
   * There are some cases in which using ES modules is beneficial, like in the case of module concatenation and tree shaking.
   *
   * @default true
   */
  esModule?: boolean;
  /**
   * Allows exporting styles as array with modules, string or constructable stylesheet (i.e. CSSStyleSheet)
   *
   * @default 'array'
   */
  exportType?: 'array' | 'string' | 'css-style-sheet';
}

export type StyleLoaderInjectType =
  | 'styleTag'
  | 'singletonStyleTag'
  | 'lazyStyleTag'
  | 'lazySingletonStyleTag'
  | 'linkTag';

export interface StyleLoaderOptions {
  /**
   * By default, style-loader generates JS modules that use the ES modules syntax.
   * There are some cases in which using ES modules is beneficial, like in the case of module concatenation and tree shaking.
   *
   * @default true
   */
  esModule?: boolean;
  /**
   * Allows to setup how styles will be injected into the DOM.
   *
   * @default 'styleTag'
   */
  injectType?: StyleLoaderInjectType;
  /**
   * If defined, the style-loader will attach given attributes with their values on <style> / <link> element.
   * @default {}
   */
  attributes?: Record<string, string>;
  /**
   * By default, the style-loader appends <style>/<link> elements to the end of the style target, which is the <head> tag of the page unless specified by insert.
   * This will cause CSS created by the loader to take priority over CSS already present in the target.
   * You can use other values if the standard behavior is not suitable for you, but we do not recommend doing this.
   *
   * @default 'head'
   */
  insert?: string | ((element: HTMLElement) => void);
  /**
   * Allows to setup absolute path to custom function that allows to override default behavior styleTagTransform.
   */
  styleTagTransform?:
    | string
    | ((
        css: string,
        styleElement: HTMLStyleElement,
        options: Record<string, any>,
      ) => void);
}
