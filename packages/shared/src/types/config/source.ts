import type { RuleSetCondition } from '@rspack/core';
import type {
  ConfigChainMergeContext,
  ConfigChainWithContext,
} from '../../reduceConfigs';
import type { RsbuildEntry, RsbuildTarget } from '../rsbuild';

export type Alias = Record<string, string | false | (string | false)[]>;

// Use a loose type to compat webpack
export type Define = Record<string, any>;

export type AliasStrategy = 'prefer-tsconfig' | 'prefer-alias';

export type Decorators = {
  /**
   * Specify the version of decorators to use.
   * @default 'legacy''
   */
  version?:
    | 'legacy' // stage 1
    | '2022-03'; // stage 3
};

export interface SourceConfig {
  /**
   * Create aliases to import or require certain modules,
   * same as the [resolve.alias](https://rspack.dev/config/resolve) config of Rspack.
   */
  alias?: ConfigChainWithContext<Alias, { target: RsbuildTarget }>;
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
  include?: RuleSetCondition[];
  /**
   * Set the entry modules.
   */
  entry?: ConfigChainMergeContext<RsbuildEntry, { target: RsbuildTarget }>;
  /**
   * Specifies that certain files that will be excluded from compilation.
   */
  exclude?: RuleSetCondition[];
  /**
   * Add a script before the entry file of each page.
   * This script will be executed before the page code.
   * It can be used to execute global logics, such as polyfill injection.
   */
  preEntry?: string | string[];
  /**
   * Used to replaces variables in your code with other values or expressions at compile time.
   */
  define?: Define;
  /**
   * Configuring decorators syntax.
   */
  decorators?: Decorators;
  /**
   * Used to import the code and style of the component library on demand.
   */
  transformImport?: false | TransformImport[];
  /**
   * Configure a custom tsconfig.json file path to use, can be a relative or absolute path.
   * @default 'tsconfig.json'
   */
  tsconfigPath?: string;
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
  alias: ConfigChainWithContext<Alias, { target: RsbuildTarget }>;
  aliasStrategy: AliasStrategy;
  preEntry: string[];
  decorators: Required<Decorators>;
}
