import type { Rspack } from '../src';
import {
  enableCacheInfoStats,
  getBuildCacheDiagnostics,
} from '../src/plugins/cacheDiagnostics';

const getReport = (stats: unknown) =>
  getBuildCacheDiagnostics({
    environment: { name: 'web' },
    isFirstCompile: true,
    isWatch: false,
    stats: stats as Rspack.Stats,
    time: 1,
  });

const reportCacheInfo = (cacheInfo: unknown) =>
  getReport({
    compilation: { options: { cache: false } },
    toJson: () => ({ cacheInfo }),
  });

describe('persistent cache diagnostics', () => {
  it('enables collection while preserving stats options and presets', () => {
    for (const [stats, expected] of [
      [undefined, {}],
      [false, { preset: 'none' }],
      [true, { preset: 'normal' }],
      ['errors-only', { preset: 'errors-only' }],
      [
        { all: false, warnings: true },
        { all: false, warnings: true },
      ],
    ] as const) {
      expect(enableCacheInfoStats(stats)).toEqual({
        ...expected,
        cacheInfo: true,
      });
    }
  });

  it('accepts structured cache information and rejects unsupported shapes', () => {
    const invalidated = {
      mode: 'persistent',
      persistent: { status: 'invalidated', reason: 'version' },
    };
    expect(reportCacheInfo(invalidated)).toMatchObject({
      ...invalidated,
      persistentSessionInitialization: null,
      moduleBuilds: null,
    });
    expect(reportCacheInfo({ mode: 'memory', persistent: null })).toMatchObject(
      {
        mode: 'memory',
        persistent: null,
        moduleBuilds: null,
      },
    );
    expect(reportCacheInfo(undefined)).toMatchObject({
      mode: 'disabled',
      persistent: null,
      moduleBuilds: null,
    });
    for (const persistent of [
      { status: 'hit', reason: null },
      { status: 'valid', reason: 'unexpected' },
    ]) {
      expect(
        reportCacheInfo({
          mode: 'persistent',
          persistent,
          moduleBuilds: { reused: 7, total: 10 },
        }),
      ).toMatchObject({
        mode: 'disabled',
        persistent: null,
        moduleBuilds: null,
      });
    }
  });

  it('keeps shared cache initialization separate from this compilation', () => {
    const cacheInfo = {
      mode: 'persistent',
      persistent: { status: 'unknown', reason: null },
      persistentSessionInitialization: {
        status: 'invalidated',
        reason: 'buildDependencies',
      },
    };
    expect(reportCacheInfo(cacheInfo)).toMatchObject(cacheInfo);
  });

  it('reports stats serialization failures without failing compilation', () => {
    const stats = {
      compilation: { options: { cache: false } },
      toJson: () => {
        throw new Error('stats unavailable');
      },
    };

    expect(getReport(stats)).toMatchObject({
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
    };

    expect(getReport(stats)).toMatchObject({
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
      reportCacheInfo({
        mode: 'persistent',
        persistent: { status: 'valid', reason: null },
        moduleBuilds,
      }).moduleBuilds;

    expect(report({ reused: 7, total: 10 })).toEqual({ reused: 7, total: 10 });
    expect(report({ reused: 0, total: 0 })).toEqual({ reused: 0, total: 0 });
    for (const counts of [
      undefined,
      null,
      { reused: 2, total: 1 },
      { reused: -1, total: 2 },
      { reused: 1.5, total: 2 },
    ]) {
      expect(report(counts)).toBeNull();
    }
  });
});
