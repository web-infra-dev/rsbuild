import {
  awaitableGetter,
  type Plugins,
  type RsbuildPlugin,
} from '@rsbuild/shared';

export const applyDefaultPlugins = (plugins: Plugins) =>
  awaitableGetter<RsbuildPlugin>([
    import('../plugins/basic').then((m) => m.pluginBasic()),
    plugins.entry?.(),
    plugins.cache?.(),
    plugins.target?.(),
    import('../plugins/output').then((m) => m.pluginOutput()),
    plugins.devtool(),
    import('../plugins/resolve').then((m) => m.pluginResolve()),
    plugins.fileSize?.(),
    plugins.cleanOutput?.(),
    import('../plugins/hmr').then((m) => m.pluginHMR()),
    plugins.asset(),
    import('../plugins/copy').then((m) => m.pluginCopy()),
    plugins.html(),
    plugins.wasm(),
    plugins.moment(),
    plugins.nodeAddons(),
    plugins.define(),
    import('../plugins/progress').then((m) => m.pluginProgress()),
    import('../plugins/minimize').then((m) => m.pluginMinimize()),
    import('../plugins/css').then((m) => m.pluginCss()),
    import('../plugins/sass').then((m) => m.pluginSass()),
    import('../plugins/less').then((m) => m.pluginLess()),
    plugins.bundleAnalyzer(),
    plugins.toml(),
    plugins.yaml(),
    plugins.splitChunks(),
    plugins.startUrl?.(),
    plugins.inlineChunk(),
    plugins.externals(),
    plugins.performance(),
    plugins.networkPerformance(),
    plugins.preloadOrPrefetch(),
    plugins.server(),
  ]);
