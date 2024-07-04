import type { Configuration } from '@rspack/core';
import type { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

// may extends cache options in the futures
export type BuildCacheOptions = {
  /** Base directory for the filesystem cache. */
  cacheDirectory?: string;
  cacheDigest?: Array<string | undefined>;
};

export type PrintFileSizeOptions = {
  total?: boolean;
  detail?: boolean;
};

export interface PreconnectOption {
  href: string;
  crossorigin?: boolean;
}

export type Preconnect = Array<string | PreconnectOption>;

export interface DnsPrefetchOption {
  href: string;
}

export type DnsPrefetch = string[];

export type PreloadIncludeType =
  | 'async-chunks'
  | 'initial'
  | 'all-assets'
  | 'all-chunks';

export type Filter = Array<string | RegExp> | ((filename: string) => boolean);

export interface PreloadOrPreFetchOption {
  type?: PreloadIncludeType;
  include?: Filter;
  exclude?: Filter;
}

export interface PerformanceConfig {
  /**
   * Whether to remove `console.[methodName]` in production build.
   */
  removeConsole?: boolean | ConsoleType[];

  /**
   * Whether to remove the locales of [moment.js](https://momentjs.com/).
   */
  removeMomentLocale?: boolean;

  /**
   * Controls the Rsbuild's caching behavior during the build process.
   */
  buildCache?: BuildCacheOptions | boolean;

  /**
   * Whether to print the file sizes after production build.
   */
  printFileSize?: PrintFileSizeOptions | boolean;

  /**
   * Configure the chunk splitting strategy.
   */
  chunkSplit?: RsbuildChunkSplit;

  /**
   * Analyze the size of output files.
   */
  bundleAnalyze?: BundleAnalyzerPlugin.Options;

  /**
   * Used to control resource `Preconnect`.
   *
   * Specifies that the user agent should preemptively connect to the target resource's origin.
   */
  preconnect?: Preconnect;

  /**
   * Used to control resource `DnsPrefetch`.
   *
   * Specifies that the user agent should preemptively perform DNS resolution for the target resource's origin.
   */
  dnsPrefetch?: DnsPrefetch;

  /**
   * Used to control resource `Preload`.
   *
   * Specifies that the user agent must preemptively fetch and cache the target resource for current navigation.
   */
  preload?: true | PreloadOrPreFetchOption;

  /**
   * Used to control resource `Prefetch`.
   *
   * Specifies that the user agent should preemptively fetch and cache the target resource as it is likely to be required for a followup navigation.
   */
  prefetch?: true | PreloadOrPreFetchOption;

  /**
   * Whether capture timing information for each module,
   * same as the [profile](https://webpack.js.org/configuration/other-options/#profile) config of webpack.
   */
  profile?: boolean;
}

export interface NormalizedPerformanceConfig extends PerformanceConfig {
  printFileSize: PrintFileSizeOptions | boolean;
  buildCache: BuildCacheOptions | boolean;
  chunkSplit: RsbuildChunkSplit;
}

export type SplitChunks = Configuration extends {
  optimization?: {
    splitChunks?: infer P;
  };
}
  ? P
  : never;

export type CacheGroups = Configuration extends {
  optimization?: {
    splitChunks?:
      | {
          cacheGroups?: infer P;
        }
      | false;
  };
}
  ? P
  : never;

export type CacheGroup = CacheGroups extends {
  [key: string]: infer P;
}
  ? P
  : null;

export type ForceSplitting = RegExp[] | Record<string, RegExp>;

export interface BaseSplitRules {
  strategy?: string;
  forceSplitting?: ForceSplitting;
  override?: SplitChunks;
}

export interface BaseChunkSplit extends BaseSplitRules {
  strategy?:
    | 'split-by-module'
    | 'split-by-experience'
    | 'all-in-one'
    | 'single-vendor';
}

export interface SplitBySize extends BaseSplitRules {
  strategy: 'split-by-size';
  minSize?: number;
  maxSize?: number;
}

export interface SplitCustom extends BaseSplitRules {
  strategy: 'custom';
  splitChunks?: SplitChunks;
}

export type RsbuildChunkSplit = BaseChunkSplit | SplitBySize | SplitCustom;
