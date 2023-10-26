import { StatsModule } from './plugin/baseStats';

export type ChunkModuleMap = {
  isAsset: boolean;
  label: string;
  modules: StatsModule[];
};

export type Modules = Record<string | number, ChunkModuleMap>;
