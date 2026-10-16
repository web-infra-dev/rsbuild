import type { BuildCacheDiagnostics, Rspack } from '../types';

type CacheInfo = Pick<
  BuildCacheDiagnostics,
  'mode' | 'persistent' | 'persistentSessionInitialization' | 'moduleBuilds'
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function enableCacheInfoStats(
  stats: Rspack.Configuration['stats'],
): Rspack.StatsOptions & { cacheInfo: true } {
  const options: Rspack.StatsOptions =
    typeof stats === 'boolean'
      ? { preset: stats ? 'normal' : 'none' }
      : typeof stats === 'string'
        ? { preset: stats }
        : (stats ?? {});
  return { ...options, cacheInfo: true };
}

function readValidation(value: unknown): CacheInfo['persistent'] {
  if (!isRecord(value)) return null;
  const { status, reason } = value;
  if (
    status !== 'cold' &&
    status !== 'valid' &&
    status !== 'invalidated' &&
    status !== 'error' &&
    status !== 'unknown'
  ) {
    return null;
  }
  if (
    reason !== null &&
    reason !== 'version' &&
    reason !== 'buildDependencies' &&
    reason !== 'recovery'
  ) {
    return null;
  }
  return { status, reason };
}

function readModuleBuilds(value: unknown): CacheInfo['moduleBuilds'] {
  if (!isRecord(value)) return null;
  const { reused, total } = value;
  if (
    typeof reused !== 'number' ||
    typeof total !== 'number' ||
    !Number.isSafeInteger(reused) ||
    !Number.isSafeInteger(total) ||
    reused < 0 ||
    reused > total
  ) {
    return null;
  }
  return { reused, total };
}

function getCacheInfo(
  value: unknown,
  configuredMode: CacheInfo['mode'],
): CacheInfo {
  const info = isRecord(value) ? value : undefined;
  if (info?.mode === 'persistent') {
    const persistent = readValidation(info.persistent);
    if (persistent) {
      return {
        mode: info.mode,
        persistent,
        persistentSessionInitialization: readValidation(
          info.persistentSessionInitialization,
        ),
        moduleBuilds: readModuleBuilds(info.moduleBuilds),
      };
    }
  }
  // Older Rspack versions expose the configured mode but no validation result.
  const mode =
    (info?.mode === 'disabled' || info?.mode === 'memory') &&
    info.persistent === null
      ? info.mode
      : configuredMode;
  return {
    mode,
    persistent:
      mode === 'persistent' ? { status: 'unknown', reason: null } : null,
    persistentSessionInitialization: null,
    moduleBuilds: null,
  };
}

export function getBuildCacheDiagnostics({
  environment,
  isFirstCompile,
  isWatch,
  stats,
  time,
}: {
  environment: { name: string };
  isFirstCompile: boolean;
  isWatch: boolean;
  stats?: Rspack.Stats;
  time: number;
}): BuildCacheDiagnostics {
  const cache = stats?.compilation.options.cache;
  const configuration: BuildCacheDiagnostics['configuration'] =
    cache && cache.type === 'persistent'
      ? {
          name: cache.name,
          version: cache.version,
          storage: { ...cache.storage },
          buildDependencies: [...cache.buildDependencies],
          maxAge: cache.maxAge,
          maxMemoryGenerations: cache.maxMemoryGenerations,
          portable: cache.portable,
          readonly: cache.readonly,
        }
      : cache && cache.type === 'filesystem'
        ? {
            name: cache.name,
            version: cache.version,
            storage: {
              type: 'filesystem',
              directory: cache.cacheDirectory,
              location: cache.cacheLocation,
            },
            buildDependencies: Object.fromEntries(
              Object.entries(cache.buildDependencies ?? {}).map(
                ([key, paths]) => [key, [...paths]],
              ),
            ),
            maxMemoryGenerations: cache.maxMemoryGenerations,
            readonly: cache.readonly,
          }
        : null;
  const mode = configuration
    ? 'persistent'
    : cache === false
      ? 'disabled'
      : cache?.type === 'memory'
        ? 'memory'
        : 'unknown';

  const logs: BuildCacheDiagnostics['logs'] = [];
  const statsOptions = {
    all: false,
    cacheInfo: true,
    logging: false,
    loggingDebug: /^rspack\.persistentCache$/,
  } as const;
  let json: Rspack.StatsCompilation | undefined;
  let statsError: string | null = null;
  try {
    json = stats?.toJson(statsOptions);
  } catch (error) {
    statsError = error instanceof Error ? error.message : String(error);
  }
  const addLogs = (
    entries: NonNullable<
      NonNullable<Rspack.StatsCompilation['logging']>[string]['entries']
    >,
  ) => {
    for (const entry of entries) {
      logs.push({ type: entry.type, message: entry.message });
      if (entry.children) addLogs(entry.children);
    }
  };
  const cacheLogs = json?.logging?.['rspack.persistentCache'];
  if (cacheLogs) addLogs(cacheLogs.entries);
  return {
    environment: environment.name,
    isFirstCompile,
    isWatch,
    time,
    ...getCacheInfo(json?.cacheInfo, mode),
    configuration,
    logs,
    statsError,
  };
}
