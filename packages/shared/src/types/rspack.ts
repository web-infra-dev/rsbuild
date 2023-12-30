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

export type RspackBuiltinsConfig = Omit<
  BuiltinsOptions,
  | 'html'
  | 'react'
  | 'pluginImport'
  | 'decorator'
  | 'presetEnv'
  | 'emotion'
  | 'relay'
>;

export declare type JscTarget =
  | 'es3'
  | 'es5'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'es2021'
  | 'es2022';
export declare type ParserConfig = TsParserConfig | EsParserConfig;
export interface TsParserConfig {
  syntax: 'typescript';
  tsx?: boolean;
  decorators?: boolean;
  dynamicImport?: boolean;
}
export interface EsParserConfig {
  syntax: 'ecmascript';
  jsx?: boolean;
  functionBind?: boolean;
  decorators?: boolean;
  decoratorsBeforeExport?: boolean;
  exportDefaultFrom?: boolean;
  importAssertions?: boolean;
}

export interface ReactConfig {
  pragma?: string;
  pragmaFrag?: string;
  throwIfNamespace?: boolean;
  development?: boolean;
  useBuiltins?: boolean;
  refresh?: boolean;
  runtime?: 'automatic' | 'classic';
  importSource?: string;
}

export interface TransformConfig {
  react?: ReactConfig;
  legacyDecorator?: boolean;
  decoratorMetadata?: boolean;
  treatConstEnumAsEnum?: boolean;
  useDefineForClassFields?: boolean;
}

// TODO: need import builtin:swc-loader options type from rspack (Simplified than actual)
export type BuiltinSwcLoaderOptions = {
  env?: {
    mode?: 'usage' | 'entry';
    debug?: boolean;
    loose?: boolean;
    skip?: string[];
    include?: string[];
    exclude?: string[];
    coreJs?: string;
    shippedProposals?: boolean;
    targets?: any;
  };
  isModule?: boolean | 'unknown';
  minify?: boolean;
  sourceMaps?: boolean;
  exclude?: string[];
  inlineSourcesContent?: boolean;
  jsc?: {
    loose?: boolean;
    parser?: ParserConfig;
    transform?: TransformConfig;
    externalHelpers?: boolean;
    target?: JscTarget;
    keepClassNames?: boolean;
    baseUrl?: string;
    paths?: {
      [from: string]: [string];
    };
    preserveAllComments?: boolean;
  };
  rspackExperiments?: Pick<
    BuiltinsOptions,
    'react' | 'decorator' | 'presetEnv' | 'emotion' | 'relay'
  > & {
    import?: BuiltinsOptions['pluginImport'];
    styledComponents?: {
      displayName?: boolean;
      ssr?: boolean;
      fileName?: boolean;
      meaninglessFileNames?: string[];
      namespace?: string;
      topLevelImportPaths?: string[];
      transpileTemplateLiterals?: boolean;
      minify?: boolean;
      pure?: boolean;
      cssProps?: boolean;
    };
  };
};
