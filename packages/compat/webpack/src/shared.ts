import { __internalHelper } from '@rsbuild/core';

const {
  plugins,
  createContext,
  createPublicContext,
  getPluginAPI,
  getChainUtils,
  initRsbuildConfig,
  setCssExtractPlugin,
  createDevServer,
  startProdServer,
  formatStats,
  getDevMiddleware,
  getStatsOptions,
} = __internalHelper;

export {
  plugins,
  createContext,
  createPublicContext,
  getPluginAPI,
  getChainUtils,
  initRsbuildConfig,
  setCssExtractPlugin,
  createDevServer,
  startProdServer,
  formatStats,
  getDevMiddleware,
  getStatsOptions,
};

export type InternalContext = __internalHelper.InternalContext;
