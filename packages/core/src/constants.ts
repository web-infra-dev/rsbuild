import { join } from 'node:path';

export const PLUGIN_SWC_NAME = 'rsbuild:swc';
export const PLUGIN_CSS_NAME = 'rsbuild:css';
export const PLUGIN_LESS_NAME = 'rsbuild:less';
export const PLUGIN_SASS_NAME = 'rsbuild:sass';
export const PLUGIN_STYLUS_NAME = 'rsbuild:stylus';

// loaders will be emitted to the same folder of the main bundle
export const LOADER_PATH = join(__dirname);
export const STATIC_PATH = join(__dirname, '../static');
export const COMPILED_PATH = join(__dirname, '../compiled');
