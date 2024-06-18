const DEFAULT_WEB_BROWSERSLIST = [
  'chrome >= 87',
  'edge >= 88',
  'firefox >= 78',
  'safari >= 14',
];

export const DEFAULT_BROWSERSLIST = {
  web: DEFAULT_WEB_BROWSERSLIST,
  'web-worker': DEFAULT_WEB_BROWSERSLIST,
  'service-worker': DEFAULT_WEB_BROWSERSLIST,
  node: ['node >= 16'],
};

export const DEFAULT_ASSET_PREFIX = '/';

// RegExp
export const JS_REGEX = /\.(?:js|mjs|cjs|jsx)$/;
export const SCRIPT_REGEX = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;
export const TS_AND_JSX_REGEX = /\.(?:ts|tsx|jsx|mts|cts)$/;
export const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;
