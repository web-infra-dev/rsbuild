/**
 * CommonJS wrapper
 */
module.exports.webpackProvider = (...args) =>
  import('./index.js').then((i) => i.webpackProvider(...args));
