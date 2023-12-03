import { join } from 'path';
import {
  getSharedPkgCompiledPath,
  SharedCompiledPkgNames,
} from '@rsbuild/shared';
import { fse } from '@rsbuild/shared';
import { RsbuildPlugin } from '../types';
import { awaitableGetter, Plugins } from '@rsbuild/shared';

export const applyDefaultPlugins = (plugins: Plugins) =>
  awaitableGetter<RsbuildPlugin>([
    import('./plugins/transition').then((m) => m.pluginTransition()),
    import('./plugins/basic').then((m) => m.pluginBasic()),
    plugins.entry(),
    // plugins.cache(),
    plugins.target(),
    import('./plugins/output').then((m) => m.pluginOutput()),
    plugins.devtool(),
    import('./plugins/resolve').then((m) => m.pluginResolve()),
    plugins.fileSize(),
    // cleanOutput plugin should before the html plugin
    plugins.cleanOutput(),
    plugins.asset(),
    plugins.html(),
    plugins.wasm(),
    plugins.moment(),
    plugins.nodeAddons(),
    plugins.define(),
    import('./plugins/css').then((m) => m.pluginCss()),
    import('./plugins/less').then((m) => m.pluginLess()),
    import('./plugins/sass').then((m) => m.pluginSass()),
    import('./plugins/minimize').then((m) => m.pluginMinimize()),
    import('./plugins/hmr').then((m) => m.pluginHMR()),
    import('./plugins/progress').then((m) => m.pluginProgress()),
    import('./plugins/swc').then((m) => m.pluginSwc()),
    plugins.externals(),
    plugins.toml(),
    plugins.yaml(),
    plugins.splitChunks(),
    plugins.startUrl(),
    plugins.inlineChunk(),
    plugins.bundleAnalyzer(),
    plugins.networkPerformance(),
    plugins.preloadOrPrefetch(),
    plugins.performance(),
    plugins.server(),
    import('./plugins/rspackProfile').then((m) => m.pluginRspackProfile()),
  ]);

export const getRspackVersion = async (): Promise<string> => {
  try {
    const core = require.resolve('@rspack/core');
    const pkg = await import(join(core, '../../package.json'));

    return pkg?.version;
  } catch (err) {
    // don't block build process
    console.error(err);
    return '';
  }
};

// apply builtin:swc-loader
export const rspackMinVersion = '0.4.0';

const compareSemver = (version1: string, version2: string) => {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const item1 = parts1[i] ?? 0;
    const item2 = parts2[i] ?? 0;
    if (item1 > item2) {
      return 1;
    }
    if (item1 < item2) {
      return -1;
    }
  }

  return 0;
};

export const isSatisfyRspackVersion = async (version: string) => {
  // The nightly version of rspack is to append `-canary-xxx` to the current version
  if (version.includes('-canary')) {
    version = version.split('-canary')[0];
  }

  if (version && /^[\d\.]+$/.test(version)) {
    return compareSemver(version, rspackMinVersion) >= 0;
  }

  // ignore other unstable versions
  return true;
};

export const getCompiledPath = (packageName: string) => {
  const providerCompilerPath = join(__dirname, '../../compiled', packageName);
  if (fse.existsSync(providerCompilerPath)) {
    return providerCompilerPath;
  } else {
    return getSharedPkgCompiledPath(packageName as SharedCompiledPkgNames);
  }
};

export const BUILTIN_LOADER = 'builtin:';
