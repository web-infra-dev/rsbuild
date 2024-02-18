import fs from 'node:fs';
import { join } from 'node:path';
import {
  getSharedPkgCompiledPath,
  type SharedCompiledPkgNames,
} from '@rsbuild/shared';
import {
  awaitableGetter,
  type Plugins,
  type RsbuildPlugin,
} from '@rsbuild/shared';

export const applyDefaultPlugins = (plugins: Plugins) =>
  awaitableGetter<RsbuildPlugin>([
    plugins.basic?.(),
    plugins.entry?.(),
    plugins.cache?.(),
    plugins.target?.(),
    import('./plugins/output').then((m) => m.pluginOutput()),
    import('./plugins/resolve').then((m) => m.pluginResolve()),
    plugins.fileSize?.(),
    plugins.cleanOutput?.(),
    plugins.asset(),
    import('./plugins/copy').then((m) => m.pluginCopy()),
    plugins.html(),
    plugins.wasm(),
    plugins.moment(),
    plugins.nodeAddons(),
    plugins.define(),
    import('./plugins/progress').then((m) => m.pluginProgress()),
    import('./plugins/minimize').then((m) => m.pluginMinimize()),
    import('./plugins/css').then((m) => m.pluginCss()),
    import('./plugins/sass').then((m) => m.pluginSass()),
    import('./plugins/less').then((m) => m.pluginLess()),
    plugins.bundleAnalyzer(),
    plugins.rsdoctor(),
    plugins.splitChunks(),
    plugins.startUrl?.(),
    plugins.inlineChunk(),
    plugins.externals(),
    plugins.performance(),
    plugins.networkPerformance(),
    plugins.preloadOrPrefetch(),
    plugins.server(),
    plugins.moduleFederation(),
  ]);

export const getCompiledPath = (packageName: string) => {
  const providerCompilerPath = join(__dirname, '../../compiled', packageName);
  if (fs.existsSync(providerCompilerPath)) {
    return providerCompilerPath;
  }
  return getSharedPkgCompiledPath(packageName as SharedCompiledPkgNames);
};
