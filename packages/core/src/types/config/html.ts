import type { ConfigChainMergeContext, ConfigChainWithContext } from '../utils';
import type { OneOrMany } from '../utils';

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

type ChainedHtmlOption<O> = ConfigChainMergeContext<O, { entryName: string }>;

export type AppIconItem = {
  /**
   * The path to the icon, can be a URL, an absolute file path,
   * or a relative path to the project root.
   */
  src: string;
  /**
   * The size of the icon.
   */
  size: number;
  /**
   * Specifies the intended target for which the icon should be generated.
   * - `apple-touch-icon` for iOS system.
   * - `web-app-manifest` for web application manifest.
   */
  target?: 'apple-touch-icon' | 'web-app-manifest';
};

export type AppIcon = {
  /**
   * The name of the application.
   * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/name
   */
  name?: string;
  /**
   * The list of icons.
   */
  icons: AppIconItem[];
  /**
   * The filename of the manifest file.
   * @default 'manifest.webmanifest'
   */
  filename?: string;
};

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
  tags?: OneOrMany<HtmlTagDescriptor>;
  /**
   * Set the favicon icon for all pages.
   */
  favicon?: ChainedHtmlOption<string>;
  /**
   * Set the web application icons to display when added to the home screen of a mobile device.
   *
   * @example
   * appIcon: {
   *   name: 'My Website',
   *   icons: [
   *     { src: './icon-192.png', size: 192 },
   *     { src: './icon-512.png', size: 512 },
   *   ]
   * }
   */
  appIcon?: AppIcon;
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
   * corresponding to the `template` config of [html-rspack-plugin](https://github.com/rspack-contrib/html-rspack-plugin).
   */
  template?: ChainedHtmlOption<string>;
  /**
   * Define the parameters in the HTML template,
   * corresponding to the `templateParameters` config of [html-rspack-plugin](https://github.com/rspack-contrib/html-rspack-plugin).
   */
  templateParameters?: ConfigChainWithContext<
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
