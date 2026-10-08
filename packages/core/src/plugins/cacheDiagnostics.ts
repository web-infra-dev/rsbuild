import type { BuildCacheDiagnostics, Rspack } from '../types';

type CacheInfo = Pick<BuildCacheDiagnostics, 'mode' | 'persistent'>;

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

export function readCacheInfo(value: unknown): CacheInfo | undefined {
  if (!isRecord(value)) return;
  const { mode, persistent } = value;
  if (mode === 'disabled' || mode === 'memory') {
    return persistent === null ? { mode, persistent } : undefined;
  }
  if (mode !== 'persistent' || !isRecord(persistent)) return;

  const { status, reason } = persistent;
  if (
    status !== 'cold' &&
    status !== 'valid' &&
    status !== 'invalidated' &&
    status !== 'error' &&
    status !== 'unknown'
  ) {
    return;
  }
  if (
    reason !== null &&
    reason !== 'version' &&
    reason !== 'buildDependencies' &&
    reason !== 'recovery'
  ) {
    return;
  }
  return { mode, persistent: { status, reason } };
}

function readModuleBuilds(
  value: unknown,
): BuildCacheDiagnostics['moduleBuilds'] {
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

export function getBuildCacheDiagnostics({
  environment,
  isFirstCompile,
  isWatch,
  stats,
  time,
}: {
  environment: string;
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
  const mode =
    cache === false
      ? 'disabled'
      : cache?.type === 'persistent' || cache?.type === 'filesystem'
        ? 'persistent'
        : cache?.type === 'memory'
          ? 'memory'
          : 'unknown';
  const fallback: CacheInfo = {
    mode,
    persistent:
      mode === 'persistent' ? { status: 'unknown', reason: null } : null,
  };

  const logs: BuildCacheDiagnostics['logs'] = [];
  // Older Rspack versions ignore cacheInfo and do not return the field.
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
  const cacheInfo = readCacheInfo(json?.cacheInfo);

  return {
    environment,
    isFirstCompile,
    isWatch,
    time,
    ...(cacheInfo ?? fallback),
    configuration,
    moduleBuilds:
      cacheInfo?.mode === 'persistent' && isRecord(json?.cacheInfo)
        ? readModuleBuilds(json.cacheInfo.moduleBuilds)
        : null,
    logs,
    statsError,
  };
}
