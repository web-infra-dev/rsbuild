/**
 * Options passed to `babel-preset-solid`.
 *
 * The option types are aligned with `@dom-expressions/compiler` and adjusted
 * for `babel-preset-solid`.
 *
 * https://github.com/solidjs/solid/blob/next/packages/babel-preset-solid/index.js
 * https://github.com/ryansolid/dom-expressions/blob/main/packages/babel-plugin-jsx/README.md
 */
export type SolidPresetOptions = {
  /**
   * The runtime module from which compiler helpers are imported.
   * @default '@solidjs/web'
   */
  moduleName?: string;
  /**
   * Whether to generate development-only runtime checks and metadata.
   * Defaults to the resolved value of the top-level `dev` option.
   */
  dev?: boolean;
  /**
   * The output mode of the compiler.
   * - `dom` generates DOM operations.
   * - `ssr` generates HTML strings for server-side rendering.
   * - `universal` generates output for a custom renderer.
   * - `dynamic` routes configured native elements to the DOM renderer and
   *   uses the universal renderer as a fallback.
   *
   * @default `'ssr'` for Node.js targets when the top-level `ssr` option is enabled, otherwise `'dom'`.
   */
  generate?: 'dom' | 'ssr' | 'universal' | 'dynamic';
  /**
   * Whether to include hydration markers in the generated output.
   * @default `true` when the top-level `ssr` option is enabled, otherwise `false`.
   */
  hydratable?: boolean;
  /**
   * Whether to automatically delegate supported events.
   * @default true
   */
  delegateEvents?: boolean;
  /**
   * Additional event names that should always use delegation.
   * @default []
   */
  delegatedEvents?: string[];
  /**
   * Whether to optimize simple boolean expressions and ternaries in JSX.
   * @default true
   */
  wrapConditionals?: boolean;
  /**
   * Whether to set the current render context on custom elements and slots.
   * @default true
   */
  contextToCustomElements?: boolean;
  /**
   * Component export names that should be recognized and automatically
   * imported from the runtime module.
   * @default `['For', 'Show', 'Switch', 'Match', 'Loading', 'Reveal', 'Portal', 'Repeat', 'Dynamic', 'Errored']`
   */
  builtIns?: string[];
  /**
   * The runtime helper used for reactive effect wrapping.
   * Set to `false` to disable effect wrapping.
   * @default 'effect'
   */
  effectWrapper?: string | false;
  /**
   * The comment marker used to assert that an expression is static and does
   * not need reactive wrapping.
   * @default '@static'
   */
  staticMarker?: string;
  /**
   * The runtime helper used to memoize derived expressions.
   * Set to `false` to disable memo wrapping.
   * @default 'memo'
   */
  memoWrapper?: string | false;
  /**
   * Whether to validate HTML nesting in generated templates.
   * @default true
   */
  validate?: boolean;
  /**
   * Whether to omit unnecessary nested closing tags from template strings.
   * More information:
   * https://github.com/solidjs/solid/blob/main/CHANGELOG.md#smaller-templates
   *
   * @default false
   */
  omitNestedClosingTags?: boolean;
  /**
   * Whether to omit the final closing tag from template strings when safe.
   * Disable this for compatibility with parsers that require explicit closing
   * tags.
   *
   * @default true
   */
  omitLastClosingTag?: boolean;
  /**
   * Whether to omit quotes around attribute values when safe.
   * Disable this for compatibility with parsers that require quoted values.
   *
   * @default true
   */
  omitQuotes?: boolean;
  /**
   * Whether quoted attributes may omit the following separator space.
   * Set to `false` for strict HTML or SVG parsers.
   * @default true
   */
  omitAttributeSpacing?: boolean;
  /**
   * Whether to inline static style values into generated template strings.
   * When disabled, style values are applied at runtime.
   * @default true
   */
  inlineStyles?: boolean;
  /**
   * Restrict JSX transformation to files whose `@jsxImportSource` pragma
   * matches this value. Set to `false` to disable this check.
   * @default false
   */
  requireImportSource?: false | string;
  /**
   * Renderer configurations used by the `dynamic` output mode.
   * @default []
   */
  renderers?: Array<{
    name: string;
    moduleName?: string;
    elements: string[];
  }>;
};
