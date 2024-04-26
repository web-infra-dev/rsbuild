import type * as Rspack from '@rspack/core';
import type { BundlerPluginInstance } from './bundlerConfig';

export type { Rspack };

type BuiltinsOptions = NonNullable<Rspack.Configuration['builtins']>;

export type RspackConfig = Omit<Rspack.Configuration, 'plugins'> & {
  builtins?: Omit<BuiltinsOptions, 'html'>;
  // Use a loose type here, so that user can pass webpack plugins
  plugins?: BundlerPluginInstance[];
};
export type RspackCompiler = Rspack.Compiler;
export type RspackMultiCompiler = Rspack.MultiCompiler;

/** T[] => T */
type GetElementType<T extends any[]> = T extends (infer U)[] ? U : never;

export type RspackRule = GetElementType<
  NonNullable<NonNullable<RspackConfig['module']>['rules']>
>;
export type RuleSetRule = Rspack.RuleSetRule;
export type RspackPluginInstance = GetElementType<
  NonNullable<RspackConfig['plugins']>
>;

export type RspackBuiltinsConfig = BuiltinsOptions;

export type RspackSourceMap = {
  version: number;
  sources: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
  sourcesContent?: string[];
  names?: string[];
};
