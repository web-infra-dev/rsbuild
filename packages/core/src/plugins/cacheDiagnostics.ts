import type {
  BuildCacheDiagnostics,
  OnAfterEnvironmentCompileFn,
  Rspack,
} from '../types';

function isPersistentCache(cache: Rspack.Configuration['cache']) {
  return (
    typeof cache === 'object' &&
    cache !== null &&
    (cache.type === 'persistent' || cache.type === 'filesystem')
  );
}

export function enableCacheDiagnostics(config: Rspack.Configuration): void {
  if (!isPersistentCache(config.cache)) return;

  const { stats } = config;
  const options: Rspack.StatsOptions =
    typeof stats === 'boolean'
      ? { preset: stats ? 'normal' : 'none' }
      : typeof stats === 'string'
        ? { preset: stats }
        : (stats ?? {});
  config.stats = Object.assign({}, options, { cacheInfo: true });
}

export function getBuildCacheDiagnostics({
  environment,
  isFirstCompile,
  isWatch,
  stats,
  time,
}: Parameters<OnAfterEnvironmentCompileFn>[0]): BuildCacheDiagnostics {
  const cache = stats?.compilation.options.cache;
  const configuration = isPersistentCache(cache) ? cache : null;
  const report: BuildCacheDiagnostics = {
    environment: environment.name,
    isFirstCompile,
    isWatch,
    time,
    mode: configuration
      ? 'persistent'
      : cache === false
        ? 'disabled'
        : cache?.type === 'memory'
          ? 'memory'
          : 'unknown',
    configuration,
    persistent: configuration ? { status: 'unknown', reason: null } : null,
    persistentSessionInitialization: null,
    moduleBuilds: null,
    statsError: null,
  };
  if (!configuration || !stats) return report;

  try {
    // Older Rspack releases omit cacheInfo.
    const options = { all: false, cacheInfo: true };
    const info:
      | Pick<
          BuildCacheDiagnostics,
          'persistent' | 'persistentSessionInitialization' | 'moduleBuilds'
        >
      | undefined = stats.toJson(options).cacheInfo;
    if (info) {
      report.persistent = info.persistent ?? report.persistent;
      report.persistentSessionInitialization =
        info.persistentSessionInitialization ?? null;
      report.moduleBuilds = info.moduleBuilds ?? null;
    }
  } catch (error) {
    report.statsError = error instanceof Error ? error.message : String(error);
  }
  return report;
}
