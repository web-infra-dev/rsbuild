import { join } from 'node:path';

// Paths
// loaders will be emitted to the same folder of the main bundle
export const ROOT_DIST_DIR = 'dist';
export const HTML_DIST_DIR = '/';
export const JS_DIST_DIR = 'static/js';
export const CSS_DIST_DIR = 'static/css';
export const SVG_DIST_DIR = 'static/svg';
export const FONT_DIST_DIR = 'static/font';
export const WASM_DIST_DIR = 'static/wasm';
export const IMAGE_DIST_DIR = 'static/image';
export const MEDIA_DIST_DIR = 'static/media';
export const LOADER_PATH: string = join(__dirname);
export const STATIC_PATH: string = join(__dirname, '../static');
export const COMPILED_PATH: string = join(__dirname, '../compiled');
export const TS_CONFIG_FILE = 'tsconfig.json';
export const HMR_SOCKET_PATH = '/rsbuild-hmr';

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
export const HTML_REGEX: RegExp = /\.html$/;
export const CSS_REGEX: RegExp = /\.css$/;

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
