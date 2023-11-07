import type {
  ArrayOrNot,
  ChainedConfig,
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
  [name: string]: string | false | MetaAttrs | undefined;
};

export interface HtmlInjectTag {
  tag: string;
  attrs?: Record<string, string | boolean | null | undefined>;
  children?: string;
  hash?: boolean | string | ((url: string, hash: string) => string);
  publicPath?: boolean | string | ((url: string, publicPath: string) => string);
  append?: boolean;
  head?: boolean;
}

export type HtmlInjectTagUtils = {
  outputName: string;
  publicPath: string;
  hash: string;
};

export type HtmlInjectTagHandler = (
  tags: HtmlInjectTag[],
  utils: HtmlInjectTagUtils,
) => HtmlInjectTag[] | void;

export type HtmlInjectTagDescriptor = HtmlInjectTag | HtmlInjectTagHandler;

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
  tags?: ArrayOrNot<HtmlInjectTagDescriptor>;
  /**
   * Inject custom html tags into the output html files.
   * The usage is same as `inject`, and you can use the "entry name" as the key to set each page individually.
   * `tagsByEntries` will overrides the value set in `tags`.
   */
  tagsByEntries?: Record<string, ArrayOrNot<HtmlInjectTagDescriptor>>;
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
  templateParameters?: ChainedConfig<Record<string, unknown>>;
  /**
   * Set different template parameters for different pages.
   * The usage is same as `templateParameters`, and you can use the "entry name" as the key to set each page individually.
   * `templateParametersByEntries` will overrides the value set in `templateParameters`.
   */
  templateParametersByEntries?: Record<
    string,
    ChainedConfig<Record<string, unknown>>
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
