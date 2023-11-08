import { Plugin } from '@rsbuild/doctor-types';

export type AssetsModules = {
  label?: string;
  isAsset?: boolean;
  modules?: Plugin.StatsModule[];
};

export type ParseBundle = (
  assetFile: string,
  modules: Plugin.StatsModule[],
) => {
  modules?: Record<string, any>;
  src?: string;
  runtimeSrc?: string;
};
