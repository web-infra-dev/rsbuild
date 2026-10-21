import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import type {
  BuildCacheDiagnostics,
  RsbuildConfig,
  Rspack,
} from '@rsbuild/core';
import fse from 'fs-extra';

test('reports cold and warm cache diagnostics for each environment', async ({
  build,
}) => {
  const reports: BuildCacheDiagnostics[] = [];
  const cacheDirectory = join(import.meta.dirname, 'test-temp-cache');
  await fse.emptyDir(cacheDirectory);
  const config: RsbuildConfig = {
    performance: {
      buildCache: { cacheDirectory },
      buildCacheDiagnostics: (report) => {
        reports.push(report);
      },
    },
    environments: {
      web: {},
      node: {
        tools: {
          rspack: (config) => {
            config.cache = false;
          },
        },
      },
    },
  };

  for (let run = 0; run < 2; run++) {
    const result = await build({ config });
    await result.close();
    const web = reports.find((report) => report.environment === 'web');
    const node = reports.find((report) => report.environment === 'node');
    expect(reports).toHaveLength(2);
    expect(web?.mode).toBe('persistent');
    expect(web?.configuration).toMatchObject({
      type: 'persistent',
      storage: { directory: cacheDirectory },
    });
    const statsOptions = { all: false, cacheInfo: true };
    const webStats = result.stats
      ?.toJson(statsOptions)
      .children?.find((stats) => stats.name === 'web');
    expect(webStats).toBeDefined();
    if (webStats?.cacheInfo) {
      expect(web?.persistent?.status).toBe(run === 0 ? 'cold' : 'valid');
      expect(web?.moduleBuilds?.total).toBeGreaterThan(0);
      expect(web?.moduleBuilds?.reused).toBe(
        run === 0 ? 0 : web?.moduleBuilds?.total,
      );
    } else {
      expect(web?.persistent).toEqual({ status: 'unknown', reason: null });
      expect(web?.moduleBuilds).toBeNull();
    }
    expect(node?.mode).toBe('disabled');
    expect(node?.configuration).toBeNull();
    expect(node?.persistent).toBeNull();
    reports.length = 0;
  }
});

test('keeps cache stats and errors scoped to the environment', async ({
  build,
}) => {
  const reports: BuildCacheDiagnostics[] = [];
  const reads: string[] = [];
  const cacheInfo = {
    persistent: { status: 'error', reason: 'recovery' },
    persistentSessionInitialization: { status: 'valid', reason: null },
    moduleBuilds: { reused: 0, total: 2 },
  };
  const probe = (compiler: Rspack.Compiler) => {
    compiler.hooks.compilation.tap('test', (compilation) => {
      compilation.hooks.statsFactory.tap('test', (factory, options) => {
        if (!('cacheInfo' in options) || !options.cacheInfo) return;
        reads.push(compiler.name!);
        if (compiler.name === 'web') throw new Error('cache stats unavailable');
        factory.hooks.result
          .for('compilation')
          .tap('test', (stats: Rspack.StatsCompilation) => ({
            ...stats,
            cacheInfo,
          }));
      });
    });
  };
  await build({
    config: {
      performance: {
        buildCache: true,
        buildCacheDiagnostics: (report) => {
          reports.push(report);
        },
      },
      environments: {
        web: {},
        server: {},
        node: { tools: { rspack: { cache: false } } },
      },
      tools: { rspack: { plugins: [{ apply: probe }] } },
    },
  });
  expect(reads.sort()).toEqual(['server', 'web']);
  expect(
    reports.find((report) => report.environment === 'server'),
  ).toMatchObject(cacheInfo);
  expect(reports.find((report) => report.environment === 'web')).toMatchObject({
    mode: 'persistent',
    statsError: 'cache stats unavailable',
    moduleBuilds: null,
  });
  expect(reports.find((report) => report.environment === 'node')).toMatchObject(
    {
      mode: 'disabled',
      statsError: null,
      moduleBuilds: null,
    },
  );
});

test('reports each development compilation', async ({ devOnly }) => {
  const entry = join(import.meta.dirname, 'test-temp-src', 'index.js');
  await fse.outputFile(entry, "console.log('first');");
  const reports: BuildCacheDiagnostics[] = [];
  await devOnly({
    config: {
      source: { entry: { index: './test-temp-src/index.js' } },
      performance: {
        buildCache: true,
        buildCacheDiagnostics: (report) => {
          reports.push(report);
        },
      },
    },
  });

  expect(reports).toHaveLength(1);
  expect(reports[0]).toMatchObject({ isFirstCompile: true, isWatch: true });
  await fse.outputFile(entry, "console.log('second');");
  await expect.poll(() => reports.length).toBeGreaterThan(1);
  expect(reports[1]).toMatchObject({ isFirstCompile: false, isWatch: true });
});

test('propagates callback failures', async ({ build }) => {
  const result = await build({
    catchBuildError: true,
    config: {
      performance: {
        buildCacheDiagnostics() {
          throw new Error('diagnostics callback failed');
        },
      },
    },
  });
  expect(result.buildError?.message).toContain('diagnostics callback failed');
  await result.close();
});
