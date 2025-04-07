import type * as Rspack from '@rspack/core';
import type RspackChain from '../../compiled/rspack-chain';
import type { TransformHandler } from './plugin';

export type { Rspack, RspackChain };

declare module '@rspack/core' {
  interface Compiler {
    __rsbuildTransformer?: Record<string, TransformHandler>;
  }
}

export interface BundlerPluginInstance {
  [index: string]: any;
  apply: (compiler: any) => void;
}

/** T[] => T */
type GetElementType<T extends any[]> = T extends (infer U)[] ? U : never;

export type RspackRule = GetElementType<Rspack.RuleSetRules>;
