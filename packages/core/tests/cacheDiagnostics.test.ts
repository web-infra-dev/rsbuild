import type { Rspack } from '../src';
import {
  enableCacheInfoStats,
  getBuildCacheDiagnostics,
  readCacheInfo,
} from '../src/plugins/cacheDiagnostics';

describe('persistent cache diagnostics', () => {
  it('enables collection while preserving stats options and presets', () => {
    expect(enableCacheInfoStats(undefined)).toEqual({ cacheInfo: true });
    expect(enableCacheInfoStats(false)).toEqual({
      preset: 'none',
      cacheInfo: true,
    });
    expect(enableCacheInfoStats(true)).toEqual({
      preset: 'normal',
      cacheInfo: true,
    });
    expect(enableCacheInfoStats('errors-only')).toEqual({
      preset: 'errors-only',
      cacheInfo: true,
    });
    expect(enableCacheInfoStats({ all: false, warnings: true })).toEqual({
      all: false,
      warnings: true,
      cacheInfo: true,
    });
  });

  it('accepts structured cache information and rejects unsupported shapes', () => {
    expect(
      readCacheInfo({
        mode: 'persistent',
        persistent: { status: 'invalidated', reason: 'version' },
      }),
    ).toEqual({
      mode: 'persistent',
      persistent: { status: 'invalidated', reason: 'version' },
    });
    expect(readCacheInfo({ mode: 'memory', persistent: null })).toEqual({
      mode: 'memory',
      persistent: null,
    });
    expect(readCacheInfo(undefined)).toBeUndefined();
    expect(
      readCacheInfo({ mode: 'persistent', persistent: { status: 'hit' } }),
    ).toBeUndefined();
  });

  it('reports stats serialization failures without failing compilation', () => {
    const stats = {
      compilation: { options: { cache: false } },
      toJson: () => {
        throw new Error('stats unavailable');
      },
    } as unknown as Rspack.Stats;

    expect(
      getBuildCacheDiagnostics({
        environment: 'web',
        isFirstCompile: true,
        isWatch: false,
        stats,
        time: 1,
      }),
    ).toMatchObject({
      mode: 'disabled',
      statsError: 'stats unavailable',
      logs: [],
      moduleBuilds: null,
    });
  });

  it('reports an experimental filesystem cache without structured stats', () => {
    const stats = {
      compilation: {
        options: {
          cache: {
            type: 'filesystem',
            cacheDirectory: '/cache',
            buildDependencies: { config: ['/project/config.js'] },
          },
        },
      },
      toJson: () => ({}),
    } as unknown as Rspack.Stats;

    expect(
      getBuildCacheDiagnostics({
        environment: 'web',
        isFirstCompile: true,
        isWatch: false,
        stats,
        time: 1,
      }),
    ).toMatchObject({
      mode: 'persistent',
      configuration: {
        storage: { type: 'filesystem', directory: '/cache' },
        buildDependencies: { config: ['/project/config.js'] },
      },
      persistent: { status: 'unknown', reason: null },
      moduleBuilds: null,
    });
  });

  it('reports valid module reuse counts and treats unavailable counts as unknown', () => {
    const report = (moduleBuilds: unknown) =>
      getBuildCacheDiagnostics({
        environment: 'web',
        isFirstCompile: true,
        isWatch: false,
        stats: {
          compilation: { options: { cache: false } },
          toJson: () => ({
            cacheInfo: {
              mode: 'persistent',
              persistent: { status: 'valid', reason: null },
              moduleBuilds,
            },
          }),
        } as unknown as Rspack.Stats,
        time: 1,
      }).moduleBuilds;

    expect(report({ reused: 7, total: 10 })).toEqual({ reused: 7, total: 10 });
    expect(report({ reused: 0, total: 0 })).toEqual({ reused: 0, total: 0 });
    expect(report(undefined)).toBeNull();
    expect(report(null)).toBeNull();
    expect(report({ reused: 2, total: 1 })).toBeNull();
    expect(report({ reused: -1, total: 2 })).toBeNull();
    expect(report({ reused: 1.5, total: 2 })).toBeNull();
  });
});
