import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import type { BuildCacheDiagnostics, RsbuildConfig } from '@rsbuild/core';
import fse from 'fs-extra';

test('reports effective cache settings and logs for each environment', async ({
  build,
}) => {
  const reports: BuildCacheDiagnostics[] = [];
  const config: RsbuildConfig = {
    performance: {
      buildCache: {
        cacheDirectory: join(import.meta.dirname, 'test-temp-cache'),
      },
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
    expect(web?.configuration?.storage.directory).toBe(
      join(import.meta.dirname, 'test-temp-cache'),
    );
    expect(web?.logs.length).toBeGreaterThan(0);
    expect(web?.moduleBuilds).toBeNull();
    expect(web?.persistent).toEqual({ status: 'unknown', reason: null });
    expect(node?.mode).toBe('disabled');
    expect(node?.configuration).toBeNull();
    expect(node?.persistent).toBeNull();
    reports.length = 0;
  }
});

test('reports each development compilation', async ({ dev }) => {
  const entry = join(import.meta.dirname, 'test-temp-src', 'index.js');
  await fse.outputFile(entry, "console.log('first');");
  const reports: BuildCacheDiagnostics[] = [];
  const server = await dev({
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

  try {
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ isFirstCompile: true, isWatch: true });
    server.clearLogs();
    await fse.outputFile(entry, "console.log('second');");
    await server.expectBuildEnd();
    expect(reports).toHaveLength(2);
    expect(reports[1]).toMatchObject({ isFirstCompile: false, isWatch: true });
  } finally {
    await server.close();
  }
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
