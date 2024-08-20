import { __internalHelper } from '@rsbuild/core';

const {
  getChainUtils,
  initRsbuildConfig,
  createDevServer,
  formatStats,
  getStatsOptions,
  stringifyConfig,
  outputInspectConfigFiles,
  getRsbuildInspectConfig,
  chainToConfig,
  modifyBundlerChain,
  registerDevHook,
  registerBuildHook,
  prettyTime,
} = __internalHelper;

export {
  getChainUtils,
  initRsbuildConfig,
  createDevServer,
  formatStats,
  getStatsOptions,
  stringifyConfig,
  outputInspectConfigFiles,
  chainToConfig,
  modifyBundlerChain,
  registerDevHook,
  registerBuildHook,
  prettyTime,
  getRsbuildInspectConfig,
};

export type InternalContext = __internalHelper.InternalContext;

export const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};
