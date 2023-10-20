import {
  MEDIA_EXTENSIONS,
  FONT_EXTENSIONS,
  IMAGE_EXTENSIONS,
  Plugins,
} from '@rsbuild/shared';

export const plugins: Plugins = {
  html: () => import('./html').then((m) => m.pluginHtml()),
  cleanOutput: () => import('./cleanOutput').then((m) => m.pluginCleanOutput()),
  startUrl: () => import('./startUrl').then((m) => m.pluginStartUrl()),
  fileSize: () => import('./fileSize').then((m) => m.pluginFileSize()),
  devtool: () => import('./devtool').then((m) => m.pluginDevtool()),
  target: () => import('./target').then((m) => m.pluginTarget()),
  entry: () => import('./entry').then((m) => m.pluginEntry()),
  cache: () => import('./cache').then((m) => m.pluginCache()),
  yaml: () => import('./yaml').then((m) => m.pluginYaml()),
  toml: () => import('./toml').then((m) => m.pluginToml()),
  svg: () => import('./svg').then((m) => m.pluginSvg()),
  splitChunks: () => import('./splitChunks').then((m) => m.pluginSplitChunks()),
  inlineChunk: () => import('./inlineChunk').then((m) => m.pluginInlineChunk()),
  bundleAnalyzer: () =>
    import('./bundleAnalyzer').then((m) => m.pluginBundleAnalyzer()),
  font: () =>
    import('./asset').then((m) => m.pluginAsset('font', FONT_EXTENSIONS)),
  image: () =>
    import('./asset').then((m) => m.pluginAsset('image', IMAGE_EXTENSIONS)),
  media: () =>
    import('./asset').then((m) => m.pluginAsset('media', MEDIA_EXTENSIONS)),
  assetsRetry: () => import('./assetsRetry').then((m) => m.pluginAssetsRetry()),
  antd: () => import('./antd').then((m) => m.pluginAntd()),
  arco: () => import('./arco').then((m) => m.pluginArco()),
  checkSyntax: () => import('./checkSyntax').then((m) => m.pluginCheckSyntax()),
  rem: () => import('./rem').then((m) => m.pluginRem()),
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
};
