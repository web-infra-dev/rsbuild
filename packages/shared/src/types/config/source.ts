import type { RsbuildEntry, RsbuildTarget } from '../rsbuild';
import type { ChainedConfig } from '../utils';

export type Alias = Record<string, string | false | (string | false)[]>;

// Use a loose type to compat webpack
export type Define = Record<string, any>;

export type AliasStrategy = 'prefer-tsconfig' | 'prefer-alias';

export interface SourceConfig {
  /**
   * Create aliases to import or require certain modules,
   * same as the [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) config of webpack.
   */
  alias?: ChainedConfig<Alias>;
  /**
   * Used to control the priority between the `paths` option in `tsconfig.json`
   * and the `alias` option in the bundler.
   */
  aliasStrategy?: AliasStrategy;
  /**
   * Specify directories or modules that need additional compilation.
   * In order to maintain faster compilation speed, Rsbuild will not compile files under node_modules through
   * `babel-loader` or `ts-loader` by default, as will as the files outside the current project directory.
   */
  include?: (string | RegExp)[];
  /**
   * Set the entry modules.
   */
  entry?: RsbuildEntry;
  /**
   * @default Use `source.entry` instead.
   */
  entries?: RsbuildEntry;
  /**
   * Specifies that certain files that will be excluded from compilation.
   */
  exclude?: (string | RegExp)[];
  /**
   * Add a script before the entry file of each page.
   * This script will be executed before the page code.
   * It can be used to execute global logics, such as polyfill injection.
   */
  preEntry?: string | string[];
  /**
   * Add a prefix to [resolve.extensions](https://webpack.js.org/configuration/resolve/#resolveextensions).
   */
  resolveExtensionPrefix?: string | Partial<Record<RsbuildTarget, string>>;
  /**
   * Used to replaces variables in your code with other values or expressions at compile time.
   */
  define?: Define;
  /**
   * Used to import the code and style of the component library on demand
   */
  transformImport?: false | TransformImport[];
}

export type TransformImport = {
  libraryName: string;
  libraryDirectory?: string;
  style?: string | boolean;
  styleLibraryDirectory?: string;
  camelToDashComponentName?: boolean;
  transformToDefaultImport?: boolean;
  // Use a loose type to compat webpack
  customName?: any;
  // Use a loose type to compat webpack
  customStyleName?: any;
};

export interface NormalizedSourceConfig extends SourceConfig {
  define: Define;
  alias: ChainedConfig<Alias>;
  aliasStrategy: AliasStrategy;
  preEntry: string[];
}
