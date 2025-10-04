/**
 * Helpers for `@rsbuild/webpack`.
 */

export { modifyBundlerChain } from '../configChain';
export { formatStats, getRsbuildStats, prettyTime } from '../helpers';
export { registerBuildHook, registerDevHook } from '../hooks';
export { inspectConfig } from '../inspectConfig';
export {
  getHTMLPlugin,
  setCssExtractPlugin,
  setHTMLPlugin,
} from '../pluginHelper';
export { createDevServer } from '../server/devServer';
export { initRsbuildConfig } from './initConfigs';
export { getChainUtils, getConfigUtils } from './rspackConfig';
