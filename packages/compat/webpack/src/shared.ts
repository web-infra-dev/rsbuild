import { __internalHelper } from '@rsbuild/core';

const {
  getChainUtils,
  initRsbuildConfig,
  createDevServer,
  formatStats,
  getDevMiddleware,
  getStatsOptions,
  stringifyConfig,
  outputInspectConfigFiles,
  getRsbuildInspectConfig,
  chainToConfig,
  modifyBundlerChain,
  onBeforeCompile,
  onCompileDone,
  prettyTime,
} = __internalHelper;

export {
  getChainUtils,
  initRsbuildConfig,
  createDevServer,
  formatStats,
  getDevMiddleware,
  getStatsOptions,
  stringifyConfig,
  outputInspectConfigFiles,
  chainToConfig,
  modifyBundlerChain,
  onCompileDone,
  onBeforeCompile,
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
