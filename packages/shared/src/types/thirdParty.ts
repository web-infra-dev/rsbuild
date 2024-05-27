import type {
  CssExtractRspackLoaderOptions,
  CssExtractRspackPluginOptions,
} from '@rspack/core';
import type { AcceptedPlugin, ProcessOptions } from 'postcss';
import type { MinifyOptions } from 'terser';
import type { Configuration as WebpackConfig } from 'webpack';
import type Autoprefixer from '../../compiled/autoprefixer/index.js';
import type { Rspack } from './rspack';

type AutoprefixerOptions = Autoprefixer.Options;

export interface CSSExtractOptions {
  pluginOptions?: CssExtractRspackPluginOptions;
  loaderOptions?: CssExtractRspackLoaderOptions;
}

export type { WebpackConfig, AutoprefixerOptions };

/** Currently using terser for html js minify and will be replaced by swc later */
export type MinifyJSOptions = MinifyOptions;

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

export type CSSLoaderModulesMode =
  | 'local'
  | 'global'
  | 'pure'
  | 'icss'
  | ((resourcePath: string) => 'local' | 'global' | 'pure' | 'icss');

export type CSSLoaderExportLocalsConvention =
  | 'asIs'
  | 'as-is'
  | 'camelCase'
  | 'camel-case'
  | 'camelCaseOnly'
  | 'camel-case-only'
  | 'dashes'
  | 'dashesOnly'
  | 'dashes-only'
  | ((name: string) => string);

export interface CSSLoaderModulesOptions {
  /**
   * Allows auto enable CSS modules/ICSS based on the filename, query or fragment.
   */
  auto?:
    | boolean
    | RegExp
    | ((
        resourcePath: string,
        resourceQuery: string,
        resourceFragment: string,
      ) => boolean);
  /**
   * Allow `css-loader` to export names from global class or id, so you can use that as local name.
   */
  exportGlobals?: boolean;
  /**
   * Style of exported class names.
   */
  exportLocalsConvention?: CSSLoaderExportLocalsConvention;
  /**
   * Export only locals.
   */
  exportOnlyLocals?: boolean;
  /**
   * Allows to specify a function to generate the classname.
   */
  getLocalIdent?: (
    context: Rspack.LoaderContext,
    localIdentName: string,
    localName: string,
  ) => string;
  /**
   * Allows to configure the generated local ident name.
   */
  localIdentName?: string;
  /**
   * Allows to redefine basic loader context for local ident name.
   */
  localIdentContext?: string;
  /**
   * Allows to add custom hash to generate more unique classes.
   */
  localIdentHashSalt?: string;
  /**
   * Allows to specify hash function to generate classes.
   */
  localIdentHashFunction?: string;
  /**
   * Allows to specify hash digest to generate classes.
   */
  localIdentHashDigest?: string;
  /**
   * Allows to specify custom RegExp for local ident name.
   */
  localIdentRegExp?: string | RegExp;
  /**
   * Controls the level of compilation applied to the input styles.
   */
  mode?: CSSLoaderModulesMode;
  /**
   * Enables/disables ES modules named export for locals.
   */
  namedExport?: boolean;
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
  modules?: boolean | string | CSSLoaderModulesOptions;
  /**
   * By default generation of source maps depends on the devtool option.
   */
  sourceMap?: boolean;
  /**
   * Allows to enables/disables or setups number of loaders applied before CSS loader for @import at-rules,
   * CSS Modules and ICSS imports, i.e. @import/composes/@value value from './values.css'/etc.
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
