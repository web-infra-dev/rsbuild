import { join } from 'node:path';

export const PLUGIN_SWC_NAME = 'rsbuild:swc';
export const PLUGIN_CSS_NAME = 'rsbuild:css';

// loaders will be emitted to the same folder of the main bundle
export const LOADER_PATH = join(__dirname);
export const STATIC_PATH = join(__dirname, '../static');
export const COMPILED_PATH = join(__dirname, '../compiled');

export const TS_CONFIG_FILE = 'tsconfig.json';

export const HTML_REGEX = /\.html$/;
export const CSS_REGEX = /\.css$/;
