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

export interface BundlerChain extends Omit<WebpackChain, 'toConfig'> {
  toConfig: () => Configuration;
}

export type BundlerChainRule = WebpackChain.Rule;
