// @ts-check
/** @type {import('prebundle').Config} */
export default {
  dependencies: [
    'open',
    'commander',
    'dotenv',
    'dotenv-expand',
    'ws',
    'on-finished',
    {
      name: 'launch-editor-middleware',
      ignoreDts: true,
      externals: {
        picocolors: '@rsbuild/shared/picocolors',
      },
    },
    {
      name: 'sirv',
      ignoreDts: true,
    },
    {
      name: 'http-compression',
      ignoreDts: true,
    },
    {
      name: 'connect-history-api-fallback',
      ignoreDts: true,
    },
  ],
};
