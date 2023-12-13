/**
 * babel-preset-solid options
 *
 * https://github.com/solidjs/solid/blob/main/packages/babel-preset-solid/index.js
 *
 * https://github.com/ryansolid/dom-expressions/blob/main/packages/babel-plugin-jsx-dom-expressions/README.md
 */
export type SolidPresetOptions = {
  /**
   * The name of the runtime module to import the methods from.
   */
  moduleName?: string;
  /**
   * The output mode of the compiler. Can be "dom"(default), "ssr". "dom" is standard output. "ssr" is for server side rendering of strings.
   * @default 'dom'
   */
  generate?: 'dom' | 'ssr';
  /**
   * Indicate whether the output should contain hydratable markers.
   * @default false
   */
  hydratable?: boolean;
  /**
   * Boolean to indicate whether to enable automatic event delegation on camelCase.
   * @default true
   */
  delegateEvents: boolean;
  /**
   * Boolean indicates whether smart conditional detection should be used. This optimizes simple boolean expressions and ternaries in JSX.
   * @default true
   */
  wrapConditionals?: boolean;
  /**
   * Boolean indicates whether to set current render context on Custom Elements and slots. Useful for seemless Context API with Web Components.
   * @default false
   */
  contextToCustomElements?: boolean;
  /**
   * Array of Component exports from module, that aren't included by default with the library. This plugin will automatically import them if it comes across them in the JSX.
   * @default string[]
   */
  builtIns?: string[];
  /**
   * This plugin leverages a heuristic for reactive wrapping and lazy evaluation of JSX expressions.
   * @default 'effect'
   */
  effectWrapper?: string;
  /**
   * Comment decorator string indicates the static expression, used to tell the compiler not to wrap them by effect function
   * @default '@once'
   */
  staticMarker?: string;
  /**
   * Memos let you efficiently use a derived value in many reactive computations. This option indicates the memo function name
   * @default 'memo'
   */
  memoWrapper?: string;
  /**
   * Checks for properly formed HTML by checking for elements that would not be allowed in certain parent elements.
   * @default true
   */
  validate?: boolean;
  /**
   * Removes unnecessary closing tags from the template output.
   * @default true
   */
  omitNestedClosingTags?: boolean;
};
