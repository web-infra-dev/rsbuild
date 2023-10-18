import type { SharedExperimentsConfig } from '@rsbuild/shared';

export type ExperimentsConfig = SharedExperimentsConfig & {
  sourceBuild?: boolean;
};

export type NormalizedExperimentsConfig = Required<ExperimentsConfig>;
