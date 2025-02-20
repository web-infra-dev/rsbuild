import path from 'node:path';
import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test.describe('should print file size correctly', async () => {
  let logs: string[];
  let restore: () => void;

  test.beforeEach(() => {
    const result = proxyConsole();
    logs = result.logs;
    restore = result.restore;
  });

  test.afterEach(() => {
    restore();
  });

  test('printFileSize: true should work', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: true,
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeTruthy();
    expect(logs.some((log) => log.includes('Total:'))).toBeTruthy();
    expect(logs.some((log) => log.includes('gzip:'))).toBeTruthy();
  });

  test('should print size of multiple environments correctly', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        output: {
          filenameHash: false,
        },
        performance: {
          printFileSize: true,
        },
        environments: {
          web: {
            output: {
              target: 'web',
            },
          },
          node: {
            output: {
              target: 'node',
              distPath: {
                root: 'dist/server',
              },
            },
          },
        },
      },
    });

    // dist/index.html
    expect(logs.some((log) => log.includes('File (web)'))).toBeTruthy();

    expect(
      logs.some(
        (log) =>
          log.includes('index.html') &&
          log.includes('dist') &&
          log.includes('kB'),
      ),
    ).toBeTruthy();

    // dist/server/index.js
    expect(logs.some((log) => log.includes('File (node)'))).toBeTruthy();
    expect(
      logs.some(
        (log) =>
          log.includes(path.join('dist', 'server')) &&
          log.includes('index.js') &&
          log.includes('kB'),
      ),
    ).toBeTruthy();

    // dist/static/js/index.js
    expect(
      logs.some(
        (log) =>
          log.includes(path.join('dist', 'static', 'js')) &&
          log.includes('index.js') &&
          log.includes('kB'),
      ),
    ).toBeTruthy();

    expect(
      logs.some((log) => log.includes('Total:') && log.includes('kB')),
    ).toBeTruthy();

    expect(
      logs.some((log) => log.includes('gzip:') && log.includes('kB')),
    ).toBeTruthy();
  });

  test('printFileSize: false should not print logs', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: false,
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeFalsy();
    expect(logs.some((log) => log.includes('Total:'))).toBeFalsy();
    expect(logs.some((log) => log.includes('gzip:'))).toBeFalsy();
  });

  test('printFileSize.detail: false should work', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: {
            detail: false,
          },
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeFalsy();
    expect(logs.some((log) => log.includes('Total:'))).toBeTruthy();
    expect(logs.some((log) => log.includes('gzip:'))).toBeTruthy();
  });

  test('printFileSize.total: false should work', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: {
            total: false,
          },
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeTruthy();
    expect(logs.some((log) => log.includes('Total:'))).toBeFalsy();
    expect(logs.some((log) => log.includes('gzip:'))).toBeFalsy();
  });

  test('should print dist folder correctly if it is not a subdir of root', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: true,
        },
        output: {
          distPath: {
            root: '../test-temp-folder/dist',
          },
        },
      },
    });

    expect(
      logs.some((log) =>
        log.includes(`..${path.sep}test-temp-folder${path.sep}dist`),
      ),
    ).toBeTruthy();
  });

  test('should allow to disable gzip-compressed size', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: {
            compressed: false,
          },
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeTruthy();
    expect(logs.some((log) => log.includes('Total:'))).toBeTruthy();
    expect(logs.some((log) => log.includes('gzip:'))).toBeFalsy();
  });

  test('should allow to filter assets by name', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: {
            include: (asset) => asset.name.endsWith('.js'),
          },
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeFalsy();
    expect(logs.some((log) => log.includes('.css'))).toBeFalsy();
    expect(logs.some((log) => log.includes('.js'))).toBeTruthy();
  });

  test('should allow to filter assets by size', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: {
            include: (asset) => asset.size > 10 * 1000,
          },
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeFalsy();
    expect(logs.some((log) => log.includes('.js'))).toBeTruthy();
    expect(logs.some((log) => log.includes('.css'))).toBeFalsy();
  });

  test('should allow to custom exclude function', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: {
            exclude: (asset) =>
              /\.(?:map|LICENSE\.txt)$/.test(asset.name) ||
              /\.html$/.test(asset.name),
          },
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeFalsy();
    expect(logs.some((log) => log.includes('.js'))).toBeTruthy();
    expect(logs.some((log) => log.includes('.css'))).toBeTruthy();
  });

  test('should not calculate gzip size if the asset is not compressible', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: true,
        },
      },
    });

    for (const log of logs) {
      if (log.includes('File')) {
        const lines = log.split('\n');
        for (const line of lines) {
          // dist/static/js/index.js should have gzip size
          if (line.includes('.js')) {
            expect(line.split('kB').length).toBe(3);
          }

          // dist/static/image/icon.png should not have gzip size
          if (line.includes('.png')) {
            expect(line.split('kB').length).toBe(2);
          }
        }
      }
    }
  });
});
