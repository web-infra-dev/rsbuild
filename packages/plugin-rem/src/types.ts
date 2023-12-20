/**
 * postcss-pxtorem options
 * https://github.com/cuth/postcss-pxtorem#options
 */
export type PxToRemOptions = {
  /**
   * (Number | Function) Represents the root element font size or returns the root element font size based on the input parameter
   */
  rootValue?: number;
  /**
   * (Number) The decimal numbers to allow the REM units to grow to.
   */
  unitPrecision?: number;
  /**
   * (Array) The properties that can change from px to rem.
   * * Values need to be exact matches.
   * * Use wildcard * to enable all properties. Example: ['*']
   * * Use * at the start or end of a word. (['*position*'] will match background-position-y)
   * * Use ! to not match a property. Example: ['*', '!letter-spacing']
   * * Combine the "not" prefix with the other prefixes. Example: ['*', '!font*']
   */
  propList?: Array<string>;
  /**
   * (Array) The selectors to ignore and leave as px.
   * * If value is string, it checks to see if selector contains the string.
   * * ['body'] will match .body-class
   * * If value is regexp, it checks to see if the selector matches the regexp.
   * * [/^body$/] will match body but not .body
   */
  selectorBlackList?: Array<string>;
  /**
   * (Boolean) Replaces rules containing rems instead of adding fallbacks.
   */
  replace?: boolean;
  /**
   * (Boolean) Allow px to be converted in media queries.
   */
  mediaQuery?: boolean;
  /**
   * (Number) Set the minimum pixel value to replace.
   */
  minPixelValue?: number;
  /**
   *  (String, Regexp, Function) The file path to ignore and leave as px.
   * * If value is string, it checks to see if file path contains the string.
   * * 'exclude' will match \project\postcss-pxtorem\exclude\path
   * * If value is regexp, it checks to see if file path matches the regexp.
   * * /exclude/i will match \project\postcss-pxtorem\exclude\path
   * * If value is function, you can use exclude function to return a true and the file will be ignored.
   * * the callback will pass the file path as a parameter, it should returns a Boolean result.
   * * function (file) { return file.indexOf('exclude') !== -1; }
   */
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
  /**
   * Used to calculate the font size of the document.
   * `documentElement.style.fontSize = (clientWidth * rootFontSize) / screenWidth`
   * @default 50
   */
  rootFontSize?: number;
  /**
   * If the `rootFontSize` exceeds the `maxRootFontSize`, the `maxRootFontSize` value will be used instead.
   */
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
