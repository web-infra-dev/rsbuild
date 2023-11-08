import path from 'path';
import fs from 'fs-extra';
import type { Compiler } from '@rspack/core';
import { DEFAULT_ASSET_PREFIX } from '../constants';
import { addTrailingSlash } from '../utils';

/** The intersection of webpack and Rspack */
export const COMPILATION_PROCESS_STAGE = {
  PROCESS_ASSETS_STAGE_ADDITIONAL: -2000,
  PROCESS_ASSETS_STAGE_PRE_PROCESS: -1000,
  PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE: 700,
  PROCESS_ASSETS_STAGE_SUMMARIZE: 1000,
  PROCESS_ASSETS_STAGE_REPORT: 5000,
};

export const generateScriptTag = () => ({
  tagName: 'script',
  attributes: {
    type: 'text/javascript',
  },
  voidTag: false,
  meta: {},
});

export const getPublicPathFromCompiler = (compiler: Compiler) => {
  const { publicPath } = compiler.options.output;
  if (typeof publicPath === 'string' && publicPath !== 'auto') {
    return addTrailingSlash(publicPath);
  }
  // publicPath function is not supported yet
  return DEFAULT_ASSET_PREFIX;
};

// TODO: use define to inject version
export const getRsbuildVersion = async (): Promise<string> => {
  const pkgJson = await fs.readJSON(path.join(__dirname, '../../package.json'));
  return pkgJson.version.replace(/\./g, '_');
};
