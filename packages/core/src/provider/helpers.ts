/**
 * Helpers for `@rsbuild/webpack`.
 */

export { modifyBundlerChain } from '../configChain';
export { prettyTime } from '../helpers';
export { formatStats, getRsbuildStats } from '../helpers/stats';
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
