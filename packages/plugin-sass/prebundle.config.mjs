// @ts-check
/** @type {import('prebundle').Config} */
export default {
  prettier: true,
  dependencies: [
    // prebundle sass-loader to make it works in Node 16
    {
      name: 'sass-loader',
      externals: {
        sass: 'sass',
        webpack: 'webpack',
      },
    },
    {
      name: 'resolve-url-loader',
      ignoreDts: true,
      externals: {
        postcss: 'postcss',
        'loader-utils': 'loader-utils',
      },
    },
  ],
};
