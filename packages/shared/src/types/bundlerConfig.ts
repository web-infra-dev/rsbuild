import type { Configuration } from '@rspack/core';
import type { RspackChain } from './utils';

export interface BundlerPluginInstance {
  [index: string]: any;
  apply: (compiler: any) => void;
}

export interface BundlerChain extends Omit<RspackChain, 'toConfig'> {
  toConfig: () => Configuration;
}
