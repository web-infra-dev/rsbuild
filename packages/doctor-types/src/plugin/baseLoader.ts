import type {
  RuleSetRule as WebpackRuleSetRule,
  Configuration as WebpackConfiguration,
} from 'webpack';
import type {
  Configuration as RspackConfiguration,
  RuleSetRule as RspackRuleSetRule,
} from '@rspack/core';
import {
  SourceMap,
  PitchLoaderDefinitionFunction as RspackPitchLoaderDefinitionFunction,
} from '@rspack/core/dist/config/adapterRuleUse';

export type RuleSetRule = RspackRuleSetRule | WebpackRuleSetRule;
export type Configuration = WebpackConfiguration | RspackConfiguration;

declare interface AdditionalData {
  [index: string]: any;
  webpackAST: object;
}

export interface LoaderDefinitionFunction<
  OptionsType = {},
  ContextAdditions = {},
> {
  (
    this: LoaderContext<OptionsType> & ContextAdditions,
    content: string,
    sourceMap?: string | SourceMap,
  ): string | void | Buffer | Promise<string | Buffer>;
}

export interface LoaderContext<OptionsType = {}> {
  getOptions(schema?: any): OptionsType;
  /**
   * Make this loader result cacheable. By default it's cacheable.
   * A cacheable loader must have a deterministic result, when inputs and dependencies haven't changed.
   * This means the loader shouldn't have other dependencies than specified with this.addDependency.
   * Most loaders are deterministic and cacheable.
   */
  cacheable(flag?: boolean): void;
  callback: (
    err?: null | Error,
    content?: string | Buffer,
    sourceMap?: string | SourceMap,
    additionalData?: AdditionalData,
  ) => void;
  /**
   * The resource path.
   * In the example: "/abc/resource.js"
   */
  resourcePath: string;
  query: string | OptionsType;
  /**
   * The resource query string.
   * Example: "?query"
   */
  resourceQuery: string;

  /**
   * The resource fragment.
   * Example: "#frag"
   */
  resourceFragment: string;

  /**
   * The resource inclusive query and fragment.
   * Example: "/abc/resource.js?query#frag"
   */
  resource: string;
  async(): (
    err?: Error | null,
    content?: string | Buffer,
    sourceMap?: string | SourceMap,
    additionalData?: AdditionalData,
  ) => void;
  /**
   * Target of compilation.
   * Example: "web"
   */
  target: string;
  loaderIndex: number;
}
export declare interface PitchLoaderDefinitionFunction<
  OptionsType = {},
  ContextAdditions = {},
> {
  (
    this: LoaderContext<OptionsType> & ContextAdditions,
    remainingRequest: string,
    previousRequest: string,
    data: object,
  ): string | void | Buffer | Promise<string | Buffer>;
}

export type LoaderDefinition<T, R> = LoaderDefinitionFunction<T, R> & {
  raw?: false;
  pitch?:
    | PitchLoaderDefinitionFunction<T>
    | RspackPitchLoaderDefinitionFunction<T>;
};
