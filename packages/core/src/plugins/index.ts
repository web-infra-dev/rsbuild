import type { ModifyHTMLTagsFn } from '@rsbuild/shared';

export const plugins = {
  basic: () => import('./basic').then((m) => m.pluginBasic()),
  html: (modifyTagsFn: ModifyHTMLTagsFn) =>
    import('./html').then((m) => m.pluginHtml(modifyTagsFn)),
  output: () => import('./output').then((m) => m.pluginOutput()),
  resolve: () => import('./resolve').then((m) => m.pluginResolve()),
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
  resourceHints: () =>
    import('./resourceHints').then((m) => m.pluginResourceHints()),
  performance: () => import('./performance').then((m) => m.pluginPerformance()),
  define: () => import('./define').then((m) => m.pluginDefine()),
  css: () => import('./css').then((m) => m.pluginCss()),
  sass: () => import('./sass').then((m) => m.pluginSass()),
  server: () => import('./server').then((m) => m.pluginServer()),
  moduleFederation: () =>
    import('./moduleFederation').then((m) => m.pluginModuleFederation()),
  manifest: () => import('./manifest').then((m) => m.pluginManifest()),
};
