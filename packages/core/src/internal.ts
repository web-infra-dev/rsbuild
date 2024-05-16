/**
 * @private
 * Some internal methods of Rsbuild.
 * Please do not use them in your Rsbuild project or plugins.
 */

export { runCli } from './cli/commands';
export { prepareCli } from './cli/prepare';
export { rspackProvider } from './provider/provider';
export { createContext, createPublicContext } from './createContext';
export { initPlugins, createPluginManager } from './pluginManager';
export { initHooks, type Hooks } from './initHooks';
export { initRsbuildConfig } from './provider/initConfigs';
export { applyCSSRule } from './plugins/css';
export { getPluginAPI } from './initPlugins';
export type { InternalContext } from './types';
export {
  setHTMLPlugin,
  getHTMLPlugin,
  setCssExtractPlugin,
} from './pluginHelper';
export { formatStats, getStatsOptions } from './provider/shared';
export { getChainUtils } from './provider/rspackConfig';
export { applySwcDecoratorConfig } from './provider/plugins/swc';
export { getDevMiddleware } from './server/devMiddleware';
export { createDevServer, startProdServer } from './server';
export { plugins } from './plugins';
