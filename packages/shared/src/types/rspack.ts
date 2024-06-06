import type * as Rspack from '@rspack/core';

export type { Rspack };

export interface BundlerPluginInstance {
  [index: string]: any;
  apply: (compiler: any) => void;
}

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
