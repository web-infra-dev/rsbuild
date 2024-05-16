import fs from 'node:fs';
import { join } from 'node:path';
import { __internalHelper } from '@rsbuild/core';
import {
  type SharedCompiledPkgNames,
  getSharedPkgCompiledPath,
} from '@rsbuild/shared';

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

export const getCompiledPath = (packageName: string) => {
  const providerCompilerPath = join(__dirname, '../../compiled', packageName);
  if (fs.existsSync(providerCompilerPath)) {
    return providerCompilerPath;
  }
  return getSharedPkgCompiledPath(packageName as SharedCompiledPkgNames);
};
