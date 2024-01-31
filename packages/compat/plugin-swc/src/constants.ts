import path from 'node:path';

export const CORE_JS_PKG_PATH = require.resolve('core-js/package.json');
export const CORE_JS_DIR = path.dirname(CORE_JS_PKG_PATH);
export const SWC_HELPERS_DIR = path.dirname(
  require.resolve('@swc/helpers/package.json'),
);
export const JS_REGEX = /\.js$/;
