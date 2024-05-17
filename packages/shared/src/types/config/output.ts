import type {
  CopyRspackPluginOptions,
  Externals,
  SwcJsMinimizerRspackPluginOptions,
} from '@rspack/core';
import type { HTMLPluginOptions } from '../../types';
import type { RsbuildTarget } from '../rsbuild';
import type { RspackConfig } from '../rspack';

export type DistPathConfig = {
  /**
   * The root directory of all files.
   * @default 'dist'
   **/
  root?: string;
  /**
   * The output directory of JavaScript files.
   * @default 'static/js'
   */
  js?: string;
  /**
   * The output directory of async JavaScript files.
   * @default 'static/js/async'
   */
  jsAsync?: string;
  /**
   * The output directory of CSS files.
   * @default 'static/css'
   */
  css?: string;
  /**
   * The output directory of async CSS files.
   * @default 'static/css/async'
   */
  cssAsync?: string;
  /**
   * The output directory of SVG images.
   * @default 'static/svg'
   */
  svg?: string;
  /**
   * The output directory of font files.
   * @default 'static/font'
   */
  font?: string;
  /**
   * The output directory of HTML files.
   * @default '/'
   */
  html?: string;
  /**
   * The output directory of Wasm files.
   * @default 'static/wasm'
   */
  wasm?: string;
  /**
   * The output directory of non-SVG images.
   * @default 'static/image'
   */
  image?: string;
  /**
   * The output directory of media resources, such as videos.
   * @default 'static/media'
   */
  media?: string;
  /**
   * The output directory of server bundles when target is `node`.
   * @default 'server'
   */
  server?: string;
  /**
   * The output directory of service worker bundles when target is `service-worker`.
   * @default 'worker'
   */
  worker?: string;
};

export type FilenameConfig = {
  /**
   * The name of the JavaScript files.
   * @default
   * - dev: '[name].js'
   * - prod: '[name].[contenthash:8].js'
   */
  js?: string;
  /**
   * The name of the CSS files.
   * @default
   * - dev: '[name].css'
   * - prod: '[name].[contenthash:8].css'
   */
  css?: string;
  /**
   * The name of the SVG images.
   * @default '[name].[contenthash:8].svg'
   */
  svg?: string;
  /**
   * The name of the font files.
   * @default '[name].[contenthash:8][ext]'
   */
  font?: string;
  /**
   * The name of non-SVG images.
   * @default '[name].[contenthash:8][ext]'
   */
  image?: string;
  /**
   * The name of media assets, such as video.
   * @default '[name].[contenthash:8][ext]'
   */
  media?: string;
};

export type DataUriLimit = {
  /** The data URI limit of the SVG image. */
  svg?: number;
  /** The data URI limit of the font file. */
  font?: number;
  /** The data URI limit of non-SVG images. */
  image?: number;
  /** The data URI limit of media resources such as videos. */
  media?: number;
};

export type Charset = 'ascii' | 'utf8';

export type LegalComments = 'none' | 'inline' | 'linked';

export type NormalizedDataUriLimit = Required<DataUriLimit>;

export type Polyfill = 'usage' | 'entry' | 'off';

export type SourceMap = {
  js?: RspackConfig['devtool'];
  css?: boolean;
};

export type CssModuleLocalsConvention =
  | 'asIs'
  | 'camelCase'
  | 'camelCaseOnly'
  | 'dashes'
  | 'dashesOnly';

export type CssModules = {
  auto?:
    | boolean
    | RegExp
    | ((
        resourcePath: string,
        resourceQuery: string,
        resourceFragment: string,
      ) => boolean);
  /**
   * Set the local ident name of CSS Modules.
   */
  localIdentName?: string;
  exportLocalsConvention?: CssModuleLocalsConvention;
};

export type Minify =
  | boolean
  | {
      /**
       * Whether to enable JavaScript minification.
       */
      js?: boolean;
      /**
       * Minimizer options of JavaScript, which will be passed to swc.
       */
      jsOptions?: SwcJsMinimizerRspackPluginOptions;
      /**
       * Whether to enable CSS minimization.
       */
      css?: boolean;
      /**
       * Whether to enable HTML minimization.
       */
      html?: boolean;
      /**
       * Minimizer options of HTML, which will be passed to html-rspack-plugin.
       */
      htmlOptions?: HTMLPluginOptions['minify'];
    };

export type CopyPluginOptions = CopyRspackPluginOptions;

export type InlineChunkTestFunction = (params: {
  size: number;
  name: string;
}) => boolean;

export type InlineChunkTest = RegExp | InlineChunkTestFunction;

export type EmitAssets = (params: { target: RsbuildTarget }) => boolean;

export interface OutputConfig {
  /**
   * Specify build targets to run in different target environments.
   */
  targets?: RsbuildTarget[];
  /**
   * At build time, prevent some `import` dependencies from being packed into bundles in your code, and instead fetch them externally at runtime.
   * For more information, please see: [Rspack Externals](https://rspack.dev/config/externals)
   */
  externals?: Externals;
  /**
   * Set the directory of the dist files.
   * Rsbuild will output files to the corresponding subdirectory according to the file type.
   */
  distPath?: DistPathConfig;
  /**
   * Sets the filename of dist files.
   */
  filename?: FilenameConfig;
  /**
   * By default, Rsbuild's output is ASCII-only and will escape all non-ASCII characters.
   * If you want to output the original characters without using escape sequences,
   * you can set `output.charset` to `utf8`.
   */
  charset?: Charset;
  /**
   * Configure how the polyfill is injected.
   */
  polyfill?: Polyfill;
  /**
   * When using CDN in the production,
   * you can use this option to set the URL prefix of static assets,
   * similar to the output.publicPath config of webpack.
   */
  assetPrefix?: string;
  /**
   * Set the size threshold to inline static assets such as images and fonts.
   * By default, static assets will be Base64 encoded and inline into the page if the size is less than 10KB.
   */
  dataUriLimit?: number | DataUriLimit;
  /**
   * Configure how to handle the legal comment.
   * A "legal comment" is considered to be any statement-level comment in JS or rule-level
   * comment in CSS that contains @license or @preserve or that starts with //! or /\*!.
   * These comments are preserved in output files by default since that follows the intent
   * of the original authors of the code.
   */
  legalComments?: LegalComments;
  /**
   * Whether to clean all files in the dist path before starting compilation.
   */
  cleanDistPath?: boolean;
  /**
   * Allow to custom CSS Modules options.
   */
  cssModules?: CssModules;
  /**
   * Whether to disable code minification in production build.
   */
  minify?: Minify;
  /**
   * Whether to generate manifest file.
   */
  manifest?: string | boolean;
  /**
   * Whether to generate source map files, and which format of source map to generate
   */
  sourceMap?: SourceMap;
  /**
   * Whether to add filename hash after production build.
   */
  filenameHash?: boolean | string;
  /**
   * Whether to inline output scripts files (.js files) into HTML with `<script>` tags.
   */
  inlineScripts?: boolean | InlineChunkTest;
  /**
   * Whether to inline output style files (.css files) into html with `<style>` tags.
   */
  inlineStyles?: boolean | InlineChunkTest;
  /**
   * Whether to inject styles into the DOM via `style-loader`.
   */
  injectStyles?: boolean;
  /**
   * Specifies the range of target browsers that the project is compatible with.
   * This value will be used by [SWC](https://github.com/swc-project/swc) and
   * [autoprefixer](https://github.com/postcss/autoprefixer) to identify the JavaScript syntax that
   * need to be transformed and the CSS browser prefixes that need to be added.
   */
  overrideBrowserslist?: string[] | Partial<Record<RsbuildTarget, string[]>>;
  /**
   * Copies the specified file or directory to the dist directory.
   */
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  /**
   * Whether to emit static assets such as image, font, etc.
   * Return `false` to avoid outputting unnecessary assets for some scenarios such as SSR.
   */
  emitAssets?: EmitAssets;
}

export type OverrideBrowserslist =
  | string[]
  | Partial<Record<RsbuildTarget, string[]>>;

export interface NormalizedOutputConfig extends OutputConfig {
  targets: RsbuildTarget[];
  filename: FilenameConfig;
  distPath: DistPathConfig;
  polyfill: Polyfill;
  sourceMap: {
    js?: RspackConfig['devtool'];
    css: boolean;
  };
  filenameHash: boolean | string;
  assetPrefix: string;
  dataUriLimit: number | NormalizedDataUriLimit;
  minify: Minify;
  inlineScripts: boolean | InlineChunkTest;
  inlineStyles: boolean | InlineChunkTest;
  injectStyles: boolean;
  cssModules: {
    localIdentName?: string;
    exportLocalsConvention: CssModuleLocalsConvention;
    auto?: CssModules['auto'];
  };
  emitAssets: EmitAssets;
}
