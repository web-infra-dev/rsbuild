import type {
  Compilation,
  StatsValue,
  StatsCompilation,
} from '@rspack/core';

export type { StatsError, StatsAsset } from '@rspack/core';

export declare class Stats {
  constructor(statsJson: any);
  hasErrors(): boolean;
  hasWarnings(): boolean;
  toJson(opts?: StatsValue): StatsCompilation;
  toString(opts?: StatsValue): string;
  compilation: Compilation;
}

export declare class MultiStats {
  stats: Stats[];
  hasErrors(): boolean;
  hasWarnings(): boolean;
  toJson(options?: StatsValue): StatsCompilation;
  toString(options?: StatsValue): string;
}
