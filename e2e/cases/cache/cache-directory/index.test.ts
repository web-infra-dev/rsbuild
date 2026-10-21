import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import type { BuildCacheDiagnostics, Rspack } from '@rsbuild/core';
import { waitForFile } from '@rstackjs/test-utils';
import fse from 'fs-extra';

const cacheDirectory = path.resolve(
  import.meta.dirname,
  './node_modules/.cache',
);

test.beforeAll(async () => {
  await fse.remove(cacheDirectory);
});

test('should use `buildCache.cacheDirectory` as expected in dev', async ({
  dev,
}) => {
  const customDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache2/dev',
  );
  await fse.remove(customDirectory);

  await dev({
    config: {
      performance: {
        buildCache: {
          cacheDirectory: customDirectory,
        },
      },
    },
  });

  await waitForFile(customDirectory);
  expect(fs.existsSync(cacheDirectory)).toBeFalsy();
});

test('should use `buildCache.cacheDirectory` as expected in build', async ({
  build,
}) => {
  const customDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache2/build',
  );
  await fse.remove(customDirectory);

  await build({
    config: {
      performance: {
        buildCache: {
          cacheDirectory: customDirectory,
        },
      },
    },
  });

  await waitForFile(customDirectory);
  expect(fs.existsSync(cacheDirectory)).toBeFalsy();
});

test('reads cache diagnostics once per opted-in environment and rebuild', async ({
  devOnly,
  copySrcDir,
}) => {
  const reports: Record<string, BuildCacheDiagnostics> = {};
  const observed = {
    performance: {
      buildCacheDiagnostics(report: BuildCacheDiagnostics) {
        reports[report.environment] = report;
      },
    },
  };
  const reads: string[] = [];
  let failRead = false;
  const probe = (compiler: Rspack.Compiler) => {
    compiler.hooks.compilation.tap('test', (compilation) => {
      compilation.hooks.statsFactory.tap('test', (_, options) => {
        if (!('cacheInfo' in options) || !options.cacheInfo) return;
        reads.push(compiler.name!);
        if (failRead) throw new Error('cache stats unavailable');
      });
    });
  };
  const entry = path.join(await copySrcDir(), 'index.js');
  const directory = path.join(import.meta.dirname, 'test-temp-cache');
  await fse.emptyDir(directory);
  const options = { all: false, cacheInfo: true };
  const { server } = await devOnly({
    config: {
      source: { entry: { index: entry } },
      performance: { buildCache: { cacheDirectory: directory } },
      environments: {
        web: { ...observed, tools: { rspack: { stats: false } } },
        quiet: { tools: { rspack: { stats: options } } },
        disabled: {
          ...observed,
          tools: { rspack: { cache: false, stats: { all: true } } },
        },
      },
      tools: { rspack: { plugins: [probe] } },
    },
  });

  expect(reads).toEqual(['web']);
  expect(Object.keys(reports).sort()).toEqual(['disabled', 'web']);
  expect(reports.disabled).toMatchObject({
    mode: 'disabled',
    moduleBuilds: null,
  });
  const { environments } = server!;
  const web = await environments.web.getStats();
  expect(web.compilation.options.stats).toMatchObject({
    preset: 'none',
    cacheInfo: true,
  });
  const info: Partial<BuildCacheDiagnostics> | undefined =
    web.toJson(options).cacheInfo;
  expect(reports.web).toMatchObject({
    isWatch: true,
    isFirstCompile: true,
    mode: 'persistent',
    configuration: { storage: { directory } },
    persistent: info?.persistent ?? { status: 'unknown', reason: null },
    persistentSessionInitialization:
      info?.persistentSessionInitialization ?? null,
    moduleBuilds: info?.moduleBuilds ?? null,
    statsError: null,
  });
  const quiet = await environments.quiet.getStats();
  const quietInfo: Partial<BuildCacheDiagnostics> | undefined =
    quiet.toJson(options).cacheInfo;
  expect(quietInfo?.mode).toBe(info?.mode);
  reads.length = 0;

  failRead = true;
  await fs.promises.appendFile(entry, '\nconsole.log("rebuilt");');
  await expect
    .poll(() => reports.web)
    .toMatchObject({
      isFirstCompile: false,
      statsError: 'cache stats unavailable',
      moduleBuilds: null,
    });
  expect(reads).toEqual(['web']);
});
