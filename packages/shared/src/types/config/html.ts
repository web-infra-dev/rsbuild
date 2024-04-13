import type {
  ArrayOrNot,
  ChainedConfigWithUtils,
  ChainedConfigCombineUtils,
} from '../utils';

export type CrossOrigin = 'anonymous' | 'use-credentials';

export type ScriptInject = boolean | 'body' | 'head';

export type ScriptLoading = 'defer' | 'module' | 'blocking';

export type OutputStructure = 'flat' | 'nested';

/**
 * custom properties
 * e.g. { name: 'viewport' content: 'width=500, initial-scale=1' }
 * */
export type MetaAttrs = { [attrName: string]: string | boolean };

export type MetaOptions = {
  /**
   * name content pair
   * e.g. { viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no' }`
   * */
  [name: string]: string | false | MetaAttrs;
};

export type HtmlBasicTag = {
  tag: string;
  attrs?: Record<string, string | boolean | null | undefined>;
  children?: string;
};

export type HtmlTag = HtmlBasicTag & {
  hash?: boolean | string | ((url: string, hash: string) => string);
  publicPath?: boolean | string | ((url: string, publicPath: string) => string);
  append?: boolean;
  head?: boolean;
};

export type HtmlTagUtils = {
  hash: string;
  entryName: string;
  outputName: string;
  publicPath: string;
};

export type HtmlTagHandler = (
  tags: HtmlTag[],
  utils: HtmlTagUtils,
) => HtmlTag[] | void;

export type HtmlTagDescriptor = HtmlTag | HtmlTagHandler;

type ChainedHtmlOption<O> = ChainedConfigCombineUtils<O, { entryName: string }>;

export interface HtmlConfig {
  /**
   * Configure the `<meta>` tag of the HTML.
   */
  meta?: ChainedHtmlOption<MetaOptions>;
  /**
   * Set the title tag of the HTML page.
   */
  title?: ChainedHtmlOption<string>;
  /**
   * Set the inject position of the `<script>` tag.
   */
  inject?: ChainedHtmlOption<ScriptInject>;
  /**
   * Inject custom html tags into the output html files.
   */
  tags?: ArrayOrNot<HtmlTagDescriptor>;
  /**
   * Set the favicon icon for all pages.
   */
  favicon?: ChainedHtmlOption<string>;
  /**
   * Set the file path of the app icon, which can be a relative path or an absolute path.
   */
  appIcon?: string;
  /**
   * Set the id of root element.
   */
  mountId?: string;
  /**
   * Set the [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) attribute
   * of the `<script>` tag.
   */
  crossorigin?: boolean | CrossOrigin;
  /**
   * Define the directory structure of the HTML output files.
   */
  outputStructure?: OutputStructure;
  /**
   * Define the path to the HTML template,
   * corresponding to the `template` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
   */
  template?: ChainedHtmlOption<string>;
  /**
   * Define the parameters in the HTML template,
   * corresponding to the `templateParameters` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
   */
  templateParameters?: ChainedConfigWithUtils<
    Record<string, unknown>,
    { entryName: string }
  >;
  /**
   * Set the loading mode of the `<script>` tag.
   */
  scriptLoading?: ScriptLoading;
}

export type NormalizedHtmlConfig = HtmlConfig & {
  meta: ChainedHtmlOption<MetaOptions>;
  title: ChainedHtmlOption<string>;
  mountId: string;
  inject: ChainedHtmlOption<ScriptInject>;
  crossorigin: boolean | CrossOrigin;
  outputStructure: OutputStructure;
  scriptLoading: ScriptLoading;
};
