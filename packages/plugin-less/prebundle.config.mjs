// @ts-check

/** @type {import('prebundle').Config} */
export default {
  prettier: true,
  dependencies: [
    // prebundle less to make correct the types
    {
      name: 'less',
      externals: {
        // needle is an optional dependency and no need to bundle it.
        needle: 'needle',
      },
    },
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
