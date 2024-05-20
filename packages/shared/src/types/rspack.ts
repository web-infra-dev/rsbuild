import type * as Rspack from '@rspack/core';
import type { BundlerPluginInstance } from './bundlerConfig';

export type { Rspack };

export type RspackConfig = Omit<Rspack.Configuration, 'plugins'> & {
  // Use a loose type here, so that user can pass webpack plugins
  plugins?: BundlerPluginInstance[];
};

/** T[] => T */
type GetElementType<T extends any[]> = T extends (infer U)[] ? U : never;

export type RspackRule = GetElementType<
  NonNullable<NonNullable<RspackConfig['module']>['rules']>
>;

export type RspackSourceMap = {
  version: number;
  sources: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
  sourcesContent?: string[];
  names?: string[];
};
