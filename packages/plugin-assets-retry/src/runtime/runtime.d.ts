// Declare types for runtime code
// We use SWC transform to compile runtime code, so we can not import types from other modules
declare type CrossOrigin = import('@rsbuild/core').CrossOrigin;
declare type AssetsRetryHookContext =
  import('../types.js').AssetsRetryHookContext;
declare type RuntimeRetryOptions = import('../types.js').RuntimeRetryOptions;
