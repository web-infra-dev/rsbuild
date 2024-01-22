import { join } from 'node:path';
import {
  color,
  getSharedPkgCompiledPath,
  type Stats,
  type MultiStats,
  type SharedCompiledPkgNames,
} from '@rsbuild/shared';
import { fse } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';
import { awaitableGetter, type Plugins } from '@rsbuild/shared';
import { formatStatsMessages } from '../client/formatStats';

export const applyDefaultPlugins = (plugins: Plugins) =>
  awaitableGetter<RsbuildPlugin>([
    import('./plugins/transition').then((m) => m.pluginTransition()),
    plugins.basic(),
    plugins.entry(),
    // plugins.cache(),
    plugins.target(),
    import('./plugins/output').then((m) => m.pluginOutput()),
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
    import('./plugins/progress').then((m) => m.pluginProgress()),
    import('./plugins/swc').then((m) => m.pluginSwc()),
    plugins.externals(),
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

// apply builtin:swc-loader
export const rspackMinVersion = '0.5.0';

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

export const isSatisfyRspackVersion = async (originalVersion: string) => {
  let version = originalVersion;

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
  }
  return getSharedPkgCompiledPath(packageName as SharedCompiledPkgNames);
};

export const BUILTIN_LOADER = 'builtin:';

export function formatStats(stats: Stats | MultiStats, showWarnings = true) {
  const statsData = stats.toJson({
    preset: 'errors-warnings',
  });

  const { errors, warnings } = formatStatsMessages(statsData);

  if (errors.length) {
    const errorMsgs = `${errors.join('\n\n')}\n`;
    const isTerserError = errorMsgs.includes('from Terser');
    const title = color.bold(
      color.red(isTerserError ? 'Minify error: ' : 'Compile error: '),
    );
    const tip = color.yellow(
      isTerserError
        ? 'Failed to minify with terser, check for syntax errors.'
        : 'Failed to compile, check the errors for troubleshooting.',
    );

    return {
      message: `${title}\n${tip}\n${errorMsgs}`,
      level: 'error',
    };
  }

  // always show warnings in tty mode
  if (warnings.length && (showWarnings || process.stdout.isTTY)) {
    const title = color.bold(color.yellow('Compile Warning: \n'));
    return {
      message: `${title}${`${warnings.join('\n\n')}\n`}`,
      level: 'warning',
    };
  }

  return {};
}
