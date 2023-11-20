import type { Configuration } from '@rspack/core';
import type { WebpackChain } from './utils';

export interface BundlerPluginInstance {
  [index: string]: any;

  apply: (compiler: {
    hooks: {
      compilation: {
        tap: any;
      };
    };
  }) => void;
}

// excludeAny: any extends boolean/string/xxx ? A : B  => A | B;
type ExtendsExcludeAny<T, E> = T extends any
  ? T extends E
    ? true
    : false
  : false;

/**
 * use `fn: (...args) => BundlerChain` instead of `fn: (...args) => WebpackChain`
 */
type ModifyReturnThis<F extends (...args: any) => any, R = ReturnType<F>> = (
  ...values: Parameters<F>
) => ExtendsExcludeAny<R, WebpackChain> extends true
  ? BundlerChain
  : ExtendsExcludeAny<R, Record<string, any>> extends true
  ? PickAndModifyThis<R>
  : R;

/**
 * use `{ a: () => BundlerChain; b: { c: () => BundlerChain }}` instead of `{ a: () => WebpackChain; b: { c: () => WebpackChain }}`
 */
type PickAndModifyThis<T, K extends keyof T = keyof T> = {
  [P in K]: T[P] extends (...args: any) => any
    ? ModifyReturnThis<T[P]>
    : ExtendsExcludeAny<T[P], Record<string, any>> extends true
    ? PickAndModifyThis<T[P]>
    : T[P];
};

export interface BundlerChain
  extends PickAndModifyThis<
    WebpackChain,
    | 'devtool'
    | 'target'
    | 'name'
    | 'merge'
    | 'cache'
    | 'plugin'
    | 'plugins'
    | 'entryPoints'
    | 'mode'
    | 'module'
    | 'context'
    | 'externals'
    | 'externalsType'
    | 'externalsPresets'
    | 'entry'
    | 'get'
    | 'output'
    | 'resolve'
    | 'optimization'
    | 'experiments'
    | 'profile'
    | 'ignoreWarnings'
    | 'infrastructureLogging'
  > {
  toConfig: () => Configuration;
}

export type WebpackChainRule = WebpackChain.Rule;
export type BundlerChainRule = PickAndModifyThis<WebpackChain.Rule>;
