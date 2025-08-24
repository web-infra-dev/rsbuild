import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const __filename: string = fileURLToPath(import.meta.url);
export const __dirname: string = dirname(__filename);
export const isDeno: boolean = typeof Deno !== 'undefined';

// Paths
// loaders will be emitted to the same folder of the main bundle
export const ROOT_DIST_DIR = 'dist';
export const HTML_DIST_DIR = './';
export const FAVICON_DIST_DIR = './';
export const JS_DIST_DIR = 'static/js';
export const CSS_DIST_DIR = 'static/css';
export const SVG_DIST_DIR = 'static/svg';
export const FONT_DIST_DIR = 'static/font';
export const WASM_DIST_DIR = 'static/wasm';
export const IMAGE_DIST_DIR = 'static/image';
export const MEDIA_DIST_DIR = 'static/media';
export const ASSETS_DIST_DIR = 'static/assets';
export const LOADER_PATH: string = join(__dirname);
export const STATIC_PATH: string = join(__dirname, '../static');
export const COMPILED_PATH: string = join(__dirname, '../compiled');
export const TS_CONFIG_FILE = 'tsconfig.json';
export const HMR_SOCKET_PATH = '/rsbuild-hmr';
export const RSBUILD_OUTPUTS_PATH = '.rsbuild';

// Defaults
export const DEFAULT_PORT = 3000;
export const DEFAULT_DATA_URL_SIZE = 4096;
export const DEFAULT_MOUNT_ID = 'root';
export const DEFAULT_DEV_HOST = '0.0.0.0';
export const DEFAULT_ASSET_PREFIX = '/';
export const DEFAULT_WEB_BROWSERSLIST: string[] = [
  'chrome >= 87',
  'edge >= 88',
  'firefox >= 78',
  'safari >= 14',
];
export const DEFAULT_BROWSERSLIST: Record<string, string[]> = {
  web: DEFAULT_WEB_BROWSERSLIST,
  'web-worker': DEFAULT_WEB_BROWSERSLIST,
  node: ['node >= 16'],
};

// RegExp
export const JS_REGEX: RegExp = /\.(?:js|mjs|cjs|jsx)$/;
export const SCRIPT_REGEX: RegExp = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;
export const CSS_REGEX: RegExp = /\.css$/;
/**
 * Regular expression to match the 'raw' query parameter.
 * Matches patterns like: `?raw`, `?raw&other=value`, `?other=value&raw`, `?raw=value`
 */
export const RAW_QUERY_REGEX: RegExp = /[?&]raw(?:&|=|$)/;
export const INLINE_QUERY_REGEX: RegExp = /^\?inline$/;
export const NODE_MODULES_REGEX: RegExp = /[\\/]node_modules[\\/]/;

// Plugins
export const PLUGIN_SWC_NAME = 'rsbuild:swc';
export const PLUGIN_CSS_NAME = 'rsbuild:css';

// Extensions
export const FONT_EXTENSIONS: string[] = [
  'woff',
  'woff2',
  'eot',
  'ttf',
  'otf',
  'ttc',
];
export const IMAGE_EXTENSIONS: string[] = [
  'png',
  'jpg',
  'jpeg',
  'pjpeg',
  'pjp',
  'gif',
  'bmp',
  'webp',
  'ico',
  'apng',
  'avif',
  'tif',
  'tiff',
  'jfif',
  'cur',
];
export const VIDEO_EXTENSIONS: string[] = ['mp4', 'webm', 'ogg', 'mov'];
export const AUDIO_EXTENSIONS: string[] = [
  'mp3',
  'wav',
  'flac',
  'aac',
  'm4a',
  'opus',
];
