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

export interface SwcReactConfig {
  pragma?: string;
  pragmaFrag?: string;
  throwIfNamespace?: boolean;
  development?: boolean;
  useBuiltins?: boolean;
  refresh?: boolean;
  /**
   * Decides which React JSX runtime to use.
   * `automatic` auto imports the functions for transpiled JSX. `classic` does not automatic import anything.
   * @default 'automatic'
   */
  runtime?: 'automatic' | 'classic';
  /**
   * Specify the import path of the JSX runtime when `jsxRuntime` is `'automatic'`.
   * @default 'react'
   */
  importSource?: string;
}

export interface TransformConfig {
  react?: SwcReactConfig;
  legacyDecorator?: boolean;
  decoratorVersion?: '2021-12' | '2022-03';
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
    experimental?: {
      plugins?: Array<[string, Record<string, any>]>;
    };
  };
  rspackExperiments?: {
    relay?:
      | boolean
      | {
          artifactDirectory?: string;
          language: 'javascript' | 'typescript' | 'flow';
        };
    emotion?:
      | boolean
      | {
          sourceMap?: boolean;
          autoLabel?: 'never' | 'dev-only' | 'always';
          labelFormat?: string;
          importMap?: {
            [packageName: string]: {
              [exportName: string]: {
                canonicalImport?: [string, string];
              };
            };
          };
        };
    import?: {
      libraryName: string;
      libraryDirectory?: string;
      customName?: string;
      customStyleName?: string;
      style?: string | boolean;
      styleLibraryDirectory?: string;
      camelToDashComponentName?: boolean;
      transformToDefaultImport?: boolean;
      ignoreEsComponent?: Array<string>;
      ignoreStyleComponent?: Array<string>;
    }[];
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

export type RspackSourceMap = {
  version: number;
  sources: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
  sourcesContent?: string[];
  names?: string[];
};
