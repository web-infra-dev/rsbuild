import type {
  Compilation,
  StatsOptions as RspackStatsOptions,
  StatsCompilation,
} from '@rspack/core';

export type { StatsError, StatsAsset } from '@rspack/core';

type StatsOptions = RspackStatsOptions & {
  /** Rspack not support below opts */
  cachedAssets?: boolean;
  groupAssetsByInfo?: boolean;
  groupAssetsByPath?: boolean;
  groupAssetsByChunk?: boolean;
  groupAssetsByExtension?: boolean;
  groupAssetsByEmitStatus?: boolean;
};

export declare class Stats {
  constructor(statsJson: any);
  hasErrors(): boolean;
  hasWarnings(): boolean;
  toJson(opts?: StatsOptions): StatsCompilation;
  toString(opts?: StatsOptions): string;
  compilation: Compilation;
}

export declare class MultiStats {
  stats: Stats[];
  hasErrors(): boolean;
  hasWarnings(): boolean;
  toJson(options?: StatsOptions): StatsCompilation;
  toString(options?: StatsOptions): string;
}
