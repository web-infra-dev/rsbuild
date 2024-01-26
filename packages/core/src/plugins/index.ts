import type { Plugins } from '@rsbuild/shared';

export const plugins: Plugins = {
  basic: () => import('./basic').then((m) => m.pluginBasic()),
  html: () => import('./html').then((m) => m.pluginHtml()),
  cleanOutput: () => import('./cleanOutput').then((m) => m.pluginCleanOutput()),
  startUrl: () => import('./startUrl').then((m) => m.pluginStartUrl()),
  fileSize: () => import('./fileSize').then((m) => m.pluginFileSize()),
  target: () => import('./target').then((m) => m.pluginTarget()),
  entry: () => import('./entry').then((m) => m.pluginEntry()),
  cache: () => import('./cache').then((m) => m.pluginCache()),
  splitChunks: () => import('./splitChunks').then((m) => m.pluginSplitChunks()),
  inlineChunk: () => import('./inlineChunk').then((m) => m.pluginInlineChunk()),
  bundleAnalyzer: () =>
    import('./bundleAnalyzer').then((m) => m.pluginBundleAnalyzer()),
  rsdoctor: () => import('./rsdoctor').then((m) => m.pluginRsdoctor()),
  asset: () => import('./asset').then((m) => m.pluginAsset()),
  wasm: () => import('./wasm').then((m) => m.pluginWasm()),
  moment: () => import('./moment').then((m) => m.pluginMoment()),
  nodeAddons: () => import('./nodeAddons').then((m) => m.pluginNodeAddons()),
  externals: () => import('./externals').then((m) => m.pluginExternals()),
  networkPerformance: () =>
    import('./networkPerformance').then((m) => m.pluginNetworkPerformance()),
  preloadOrPrefetch: () =>
    import('./preloadOrPrefetch').then((m) => m.pluginPreloadOrPrefetch()),
  performance: () => import('./performance').then((m) => m.pluginPerformance()),
  define: () => import('./define').then((m) => m.pluginDefine()),
  server: () => import('./server').then((m) => m.pluginServer()),
};
