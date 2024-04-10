/**
 * @private
 * Some internal methods of Rsbuild.
 * Please do not use them in your Rsbuild project or plugins.
 */

export { rspackProvider } from './provider/provider';
export { createContext, createPublicContext } from './provider/createContext';
export { initPlugins, createPluginManager } from './pluginManager';
export { initHooks, type Hooks } from './initHooks';
export { initRsbuildConfig } from './provider/initConfigs';
export { getPluginAPI } from './provider/initPlugins';
export { applyBaseCSSRule, applyCSSModuleRule } from './provider/plugins/css';
export type { InternalContext } from './types';
export { setHTMLPlugin, getHTMLPlugin } from './htmlUtils';
export { formatStats, getStatsOptions } from './provider/shared';
export { getChainUtils } from './provider/rspackConfig';
export { applySwcDecoratorConfig } from './provider/plugins/swc';
export { getDevMiddleware } from './provider/devMiddleware';
export { createDevServer, startProdServer } from './server';
export { plugins } from './plugins';
