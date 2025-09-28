// @ts-check
/** @type {import('prebundle').Config} */
export default {
  prettier: true,
  dependencies: [
    {
      name: 'babel-loader',
      ignoreDts: true,
      externals: {
        '@babel/core': '@babel/core',
      },
    },
  ],
};
