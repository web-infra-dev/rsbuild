/**
 * postcss-pxtorem options
 * https://github.com/cuth/postcss-pxtorem#options
 */
export type PxToRemOptions = {
  rootValue?: number;
  unitPrecision?: number;
  propList?: Array<string>;
  selectorBlackList?: Array<string>;
  replace?: boolean;
  mediaQuery?: boolean;
  minPixelValue?: number;
  exclude?: string | RegExp | ((filePath: string) => boolean);
};

export type PluginRemOptions = {
  /**
   * Whether to generate runtime code to set root font size.
   * @default true
   */
  enableRuntime?: boolean;
  /**
   *  Whether to inline runtime code to HTML.
   * @default true
   */
  inlineRuntime?: boolean;
  /** Usually, `fontSize = (clientWidth * rootFontSize) / screenWidth` */
  screenWidth?: number;
  rootFontSize?: number;
  maxRootFontSize?: number;
  /** Get clientWidth from the url query based on widthQueryKey */
  widthQueryKey?: string;
  /** The entries to ignore */
  excludeEntries?: string[];
  /**
   * Whether to use height to calculate rem in landscape.
   * @default false
   */
  supportLandscape?: boolean;
  /** Whether to use rootFontSize when large than maxRootFontSize（scene：pc） */
  useRootFontSizeBeyondMax?: boolean;
  /** CSS (postcss-pxtorem) option */
  pxtorem?: PxToRemOptions;
};
