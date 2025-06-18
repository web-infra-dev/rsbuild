import type {
  EnvConfig,
  Extensions,
  JsMinifyOptions,
  ReactConfig,
  TransformConfig,
} from '@modern-js/swc-plugins';
import type _ from 'lodash';

export type {
  JsMinifyOptions,
  Output,
  TransformConfig,
} from '@modern-js/swc-plugins';

export type OuterExtensions = Omit<Extensions, 'ssrLoaderId' | 'configRoutes'>;

export interface ObjPluginSwcOptions<T extends 'inner' | 'outer' = 'inner'>
  extends TransformConfig {
  presetReact?: ReactConfig;
  presetEnv?: EnvConfig;

  jsMinify?: boolean | JsMinifyOptions;
  cssMinify?: boolean | CssMinifyOptions;

  /**
   * Specifies whether to modularize the import of [lodash](https://npmjs.com/package/lodash)
   * and remove unused lodash modules to reduce the code size of lodash.
   */
  transformLodash?: boolean;

  extensions?: T extends 'inner' ? Extensions : OuterExtensions;

  overrides?: Override<T>[];
}

export type Override<T extends 'inner' | 'outer'> = Omit<
  ObjPluginSwcOptions<T>,
  'test' | 'include' | 'exclude'
> & {
  test?: RegExp;
  include?: RegExp[];
  exclude?: RegExp[];
};

export type FnPluginSwcOptions = (
  config: TransformConfig,
  utilities: Utilities,
) => TransformConfig | undefined;

export type PluginSwcOptions<T extends 'inner' | 'outer' = 'inner'> =
  | ObjPluginSwcOptions<T>
  | FnPluginSwcOptions;

interface Utilities {
  mergeConfig: typeof _.merge;
  setConfig: typeof _.set;
}

export interface CssMinifyOptions {
  sourceMap?: boolean;
  inlineSourceContent?: boolean;
}
