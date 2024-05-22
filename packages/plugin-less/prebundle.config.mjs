// @ts-check
/** @type {import('prebundle').Config} */
export default {
  dependencies: [
    // prebundle less-loader to make it works in Node 16
    {
      name: 'less-loader',
      ignoreDts: true,
      externals: {
        less: 'less',
      },
    },
  ],
};
