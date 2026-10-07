import type { Rspack } from '../src';
import {
  getBuildCacheDiagnostics,
  readCacheInfo,
} from '../src/plugins/cacheDiagnostics';

describe('persistent cache diagnostics', () => {
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
      reused: 'unknown',
    });
  });
});
