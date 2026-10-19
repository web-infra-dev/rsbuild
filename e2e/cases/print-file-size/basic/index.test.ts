import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { expect, test } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';
import { rs } from 'rstack/test';
import { extractFileSizeLogs } from '../helper';

test('should print file size after building by default', async ({ build }) => {
  const rsbuild = await build();

  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should print size of multiple environments correctly', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      output: {
        filenameHash: false,
      },
      environments: {
        web: {},
        node: {
          output: {
            target: 'node',
            distPath: 'dist/server',
          },
        },
      },
    },
  });

  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should not print logs when printFileSize is false', async ({ build }) => {
  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: false,
      },
    },
  });

  expect(extractFileSizeLogs(rsbuild.logs)).toEqual('');
});

test('should skip compression when detail is zero and total is disabled', async ({
  build,
}) => {
  const createGzip = rs.spyOn(zlib, 'createGzip');
  try {
    const rsbuild = await build({
      config: {
        performance: {
          printFileSize: { detail: 0, total: false },
        },
      },
    });

    expect(createGzip).not.toHaveBeenCalled();
    expect(extractFileSizeLogs(rsbuild.logs)).toEqual('');
  } finally {
    createGzip.mockRestore();
  }
});

for (const detail of [false, 0] as const) {
  test(`should not print details when printFileSize.detail is ${detail}`, async ({
    build,
  }) => {
    const rsbuild = await build({
      config: {
        performance: {
          printFileSize: {
            detail,
          },
        },
      },
    });

    expect(extractFileSizeLogs(rsbuild.logs)).toEqual(`
Total size (web): X.X kB (X.X kB gzipped)`);
  });
}

test('should limit details to the largest files and preserve totals and diff snapshots', async ({
  cwd,
  build,
}) => {
  await rm(join(cwd, 'node_modules/.cache'), { recursive: true, force: true });
  const limited = await build({
    config: {
      performance: {
        printFileSize: { detail: 2, diff: true },
      },
    },
  });
  const limitedLogs = extractFileSizeLogs(limited.logs);
  const limitedFiles = limitedLogs.match(/^dist\/\S+/gm);
  const limitedTotal = limited.logs.join('\n').match(/Total:\s+(.+)/)?.[1];
  expect(limitedFiles).toHaveLength(2);
  expect(limitedLogs).toContain('... 3 more files not shown');
  expect(limitedTotal).toBeDefined();
  limited.clearLogs();

  const full = await build({
    config: {
      performance: {
        printFileSize: { detail: 20, diff: true },
      },
    },
  });
  const fullLogs = extractFileSizeLogs(full.logs);
  const fullFiles = fullLogs.match(/^dist\/\S+/gm);
  expect(fullFiles).toHaveLength(5);
  expect(limitedFiles).toEqual(fullFiles!.slice(-2));
  expect(fullLogs).not.toContain('not shown');
  // Unchanged files should have no size diff, including previously hidden files.
  expect(fullLogs).not.toMatch(/\([+-]/);
  expect(full.logs.join('\n').match(/Total:\s+(.+)/)?.[1]).toBe(limitedTotal);
});

test('printFileSize.total: false should work', async ({ build }) => {
  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: {
          total: false,
        },
      },
    },
  });

  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should print dist folder correctly if it is not a subdir of root', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      output: {
        distPath: '../test-temp-folder/dist',
      },
    },
  });

  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should allow to disable gzip-compressed size', async ({ build }) => {
  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: {
          compressed: false,
        },
      },
    },
  });

  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should allow to filter assets by name', async ({ build }) => {
  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: {
          include: (asset) => asset.name.endsWith('.js'),
        },
      },
    },
  });

  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should allow to filter assets by size', async ({ build }) => {
  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: {
          include: (asset) => asset.size > 10 * 1000,
        },
      },
    },
  });

  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should allow to custom exclude function', async ({ build }) => {
  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: {
          exclude: (asset) =>
            /\.(?:map|LICENSE\.txt)$/.test(asset.name) ||
            /\.html$/.test(asset.name),
        },
      },
    },
  });

  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should not calculate gzip size if the asset is not compressible', async ({
  build,
}) => {
  const rsbuild = await build();
  const logs = extractFileSizeLogs(rsbuild.logs);

  expect(logs).toMatch(
    /^dist\/static\/image\/icon\.\[\[hash\]\]\.png\s+X\.X kB$/m,
  );
});

test('should calculate gzip size for script-like assets', async ({ build }) => {
  const emitTsAssetPlugin: RsbuildPlugin = {
    name: 'emit-ts-asset',
    setup(api) {
      api.processAssets({ stage: 'additional' }, ({ compilation, sources }) => {
        compilation.emitAsset(
          'static/assets/script.ts',
          new sources.RawSource("const value = 'ts';\n"),
        );
      });
    },
  };

  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: {
          total: false,
        },
      },
      plugins: [emitTsAssetPlugin],
    },
  });

  const logs = extractFileSizeLogs(rsbuild.logs);

  expect(logs).toMatch(/dist\/static\/assets\/script\.ts\s+X\.X kB\s+X\.X kB/);
});

for (const detail of [false, 2] as const) {
  test(`should pass all assets to a custom total function with detail: ${detail}`, async ({
    build,
  }) => {
    const rsbuild = await build({
      config: {
        performance: {
          printFileSize: {
            total: ({ assets }) => {
              return `Generated ${assets.length} files.`;
            },
            detail,
          },
        },
      },
    });

    await rsbuild.expectLog('Generated 5 files.');
  });
}

for (const [type, level] of [
  ['gzip', undefined],
  ['gzip', 0],
  ['gzip', 9],
  ['brotli', undefined],
  ['brotli', 0],
  ['brotli', 11],
] as const) {
  test(`should report accurate ${type} sizes at level ${level ?? 'default'}`, async ({
    build,
  }) => {
    const rsbuild = await build({
      config: {
        performance: {
          printFileSize: {
            compressed: { type, level },
            detail: false,
            include: ({ name }) => name === 'index.html',
            total: ({ totalGzipSize, totalBrotliSize }) =>
              `Sizes: ${totalGzipSize}/${totalBrotliSize}`,
          },
        },
      },
    });
    const html = await readFile(join(rsbuild.distPath, 'index.html'));
    const size =
      type === 'brotli'
        ? zlib.brotliCompressSync(html, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: level ?? 6 },
          }).length
        : zlib.gzipSync(html, { level }).length;
    await rsbuild.expectLog(
      type === 'brotli' ? `Sizes: 0/${size}` : `Sizes: ${size}/undefined`,
    );
  });
}

test('should print Brotli details and total', async ({ build }) => {
  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: { compressed: { type: 'brotli' } },
      },
    },
  });
  expect(extractFileSizeLogs(rsbuild.logs)).toMatchSnapshot();
});

test('should print Brotli total without details', async ({ build }) => {
  const rsbuild = await build({
    config: {
      performance: {
        printFileSize: {
          compressed: { type: 'brotli' },
          detail: false,
        },
      },
    },
  });
  expect(extractFileSizeLogs(rsbuild.logs)).toEqual(`
Total size (web): X.X kB (X.X kB brotli)`);
});
