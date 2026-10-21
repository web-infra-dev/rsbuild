import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import type { BuildCacheDiagnostics, Rspack } from '@rsbuild/core';
import fse from 'fs-extra';

const buildCache = {
  cacheDirectory: join(import.meta.dirname, 'test-temp-cache'),
};
test.beforeEach(async () => {
  await fse.emptyDir(buildCache.cacheDirectory);
});

function captureReports() {
  const reports: BuildCacheDiagnostics[] = [];
  const performance = {
    buildCache,
    buildCacheDiagnostics(report: BuildCacheDiagnostics) {
      reports.push(report);
    },
  };
  return { reports, performance };
}

test('reports cold and warm module reuse when Rspack exposes it', async ({
  build,
}) => {
  for (const cold of [true, false]) {
    const { reports, performance } = captureReports();
    let hasCacheInfo: boolean | undefined;
    const inspect = (compiler: Rspack.Compiler) => {
      compiler.hooks.done.tap('test', (stats) => {
        const options = { all: false, cacheInfo: true };
        hasCacheInfo = Boolean(stats.toJson(options).cacheInfo);
      });
    };
    await build({
      config: { performance, tools: { rspack: { plugins: [inspect] } } },
    });
    expect(hasCacheInfo).toBeDefined();
    expect(reports).toHaveLength(1);
    const [report] = reports;
    expect(report).toMatchObject({
      mode: 'persistent',
      configuration: {
        type: 'persistent',
        storage: { directory: buildCache.cacheDirectory },
      },
    });
    if (hasCacheInfo) {
      expect(report.persistent).toEqual({
        status: cold ? 'cold' : 'valid',
        reason: null,
      });
      expect(report.moduleBuilds?.total).toBeGreaterThan(0);
      expect(report.moduleBuilds?.reused).toBe(
        cold ? 0 : report.moduleBuilds?.total,
      );
    } else {
      expect(report.persistent).toEqual({ status: 'unknown', reason: null });
      expect(report.moduleBuilds).toBeNull();
    }
  }
});

test('reads cache stats once per opted-in persistent environment', async ({
  build,
}) => {
  const { reports, performance } = captureReports();
  const observed = { performance };
  const reads: string[] = [];
  const recovered = {
    persistent: { status: 'error', reason: 'recovery' },
    persistentSessionInitialization: { status: 'valid', reason: null },
  };
  const moduleBuilds = { reused: 1, total: 2 };
  const probe = (compiler: Rspack.Compiler) => {
    compiler.hooks.compilation.tap('test', (compilation) => {
      compilation.hooks.statsFactory.tap('test', (factory, options) => {
        if (!('cacheInfo' in options) || !options.cacheInfo) return;
        reads.push(compiler.name!);
        if (compiler.name === 'broken')
          throw new Error('cache stats unavailable');
        factory.hooks.result
          .for('compilation')
          .tap('test', (stats: Rspack.StatsCompilation) => ({
            ...stats,
            cacheInfo: {
              ...recovered,
              get moduleBuilds() {
                if (compiler.name === 'unreadable')
                  throw new Error('module counts unavailable');
                return moduleBuilds;
              },
            },
          }));
      });
    });
  };
  await build({
    config: {
      performance: { buildCache },
      environments: {
        broken: observed,
        quiet: {},
        recovered: observed,
        unreadable: observed,
        disabled: { ...observed, tools: { rspack: { cache: false } } },
      },
      tools: { rspack: { plugins: [probe] } },
    },
  });
  expect(reads.sort()).toEqual(['broken', 'recovered', 'unreadable']);
  const byEnvironment = Object.fromEntries(
    reports.map((report) => [report.environment, report]),
  );
  expect(byEnvironment.quiet).toBeUndefined();
  expect(byEnvironment.recovered).toMatchObject({ ...recovered, moduleBuilds });
  expect(byEnvironment.unreadable).toMatchObject({
    ...recovered,
    moduleBuilds: null,
    statsError: 'module counts unavailable',
  });
  expect(byEnvironment.broken).toMatchObject({
    mode: 'persistent',
    statsError: 'cache stats unavailable',
    moduleBuilds: null,
  });
  expect(byEnvironment.disabled).toMatchObject({
    mode: 'disabled',
    configuration: null,
    persistent: null,
    statsError: null,
    moduleBuilds: null,
  });
});

test('reports each development compilation', async ({ devOnly }) => {
  const entry = join(import.meta.dirname, 'test-temp-src', 'index.js');
  await fse.outputFile(entry, "console.log('first');");
  const { reports, performance } = captureReports();
  await devOnly({
    config: {
      source: { entry: { index: './test-temp-src/index.js' } },
      performance,
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
});
