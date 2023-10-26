interface StatsOptionsObj {
  all?: boolean;
  preset?: 'normal' | 'none' | 'verbose' | 'errors-only' | 'errors-warnings';
  assets?: boolean;
  chunks?: boolean;
  modules?: boolean;
  entrypoints?: boolean;
  warnings?: boolean;
  warningsCount?: boolean;
  errors?: boolean;
  errorsCount?: boolean;
  colors?: boolean;

  /** Rspack not support below opts */
  cachedAssets?: boolean;
  groupAssetsByInfo?: boolean;
  groupAssetsByPath?: boolean;
  groupAssetsByChunk?: boolean;
  groupAssetsByExtension?: boolean;
  groupAssetsByEmitStatus?: boolean;
}

/** webpack not support boolean or string */
type StatsOptions = StatsOptionsObj;

interface StatsAssetInfo {
  development?: boolean;
}

export interface StatsAsset {
  type: string;
  name: string;
  size: number;
  chunks?: (string | number)[];
  chunkNames?: Array<string | number>;
  info: StatsAssetInfo;
}

interface StatsError {
  message: string;
  formatted?: string;
}

export interface StatsModule {
  type?: string;
  moduleType?: string;
  identifier?: string;
  name?: string;
  id?: string | number;
  chunks?: Array<string | number>;
  size?: number;
  issuer?: string;
  issuerName?: string;
  assets?: Array<string | number>;
  reasons?: Array<StatsModuleReason>;
  source?: string | Buffer;
  nameForCondition?: string; // rspack is lack of nameForCondition type
  depth?: number | string; // rspack is lack of nameForCondition type ? packages/rspack/src/stats/DefaultStatsPrinterPlugin.ts , impact tree-shaking analysis ability.
  loc?: string; // rspack is lack of nameForCondition type ? packages/rspack/src/stats/DefaultStatsPrinterPlugin.ts
  modules?: StatsModule[]; // rspack is lack of nameForCondition type
}

export interface StatsModuleReason {
  moduleIdentifier?: string;
  moduleName?: string;
  moduleId?: string | number;
  type?: string;
  userRequest?: string;
  children?: StatsModuleReason[]; // rspack is lack of children type
  loc?: string; // rspack is lack of children type
}
export interface JSStatsChunkGroup {
  name?: string;
  assets?: { name: string; size?: number }[];
  chunks?: (string | number)[];
  assetsSize?: number;
}

export type StatsChunkGroup = JSStatsChunkGroup;

export interface StatsCompilation {
  version?: string;
  /** rspack version */
  // rspackVersion?: string;
  name?: string;
  hash?: string;
  time?: number;
  builtAt?: number;
  publicPath?: string;
  assetsByChunkName?: Record<string, string[]>;
  filteredModules?: number;
  assets?: Array<StatsAsset>;
  modules?: Array<StatsModule>;
  chunks?: Array<StatsChunk>;
  entrypoints?: Record<string, StatsChunkGroup>;
  children?: StatsCompilation[];
  errors?: Array<StatsError>;
  errorsCount?: number;
  warnings?: Array<StatsError>;
  warningsCount?: number;
  outputPath?: string;
}

interface StatsChunk {
  type?: string;
  files?: Array<string>;
  id?: string | number;
  entry: boolean;
  initial: boolean;
  names?: Array<string>;
  size: number;
  modules?: Array<StatsModule>;
}

export declare class Stats {
  constructor(statsJson: any);

  hasErrors(): boolean;

  hasWarnings(): boolean;

  toJson(opts?: StatsOptions): StatsCompilation;

  toString(opts?: StatsOptions): string;
}
