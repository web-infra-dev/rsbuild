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
    expect(logs.some((log) => log.includes('Total size:'))).toBeTruthy();
    expect(logs.some((log) => log.includes('Gzipped size:'))).toBeTruthy();
  });

  test('should print size of multiple targets correctly', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        output: {
          filenameHash: false,
          targets: ['web', 'node'],
        },
        performance: {
          printFileSize: true,
        },
      },
    });

    // dist/index.html
    expect(
      logs.some(
        (log) =>
          log.includes('index.html') &&
          log.includes('dist') &&
          log.includes('kB'),
      ),
    ).toBeTruthy();

    // dist/server/index.js
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
      logs.some((log) => log.includes('Total size:') && log.includes('kB')),
    ).toBeTruthy();

    expect(
      logs.some((log) => log.includes('Gzipped size:') && log.includes('kB')),
    ).toBeTruthy();
  });

  test('printFileSize: false should work', async () => {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: false,
        },
      },
    });

    expect(logs.some((log) => log.includes('index.html'))).toBeFalsy();
    expect(logs.some((log) => log.includes('Total size:'))).toBeFalsy();
    expect(logs.some((log) => log.includes('Gzipped size:'))).toBeFalsy();
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
    expect(logs.some((log) => log.includes('Total size:'))).toBeTruthy();
    expect(logs.some((log) => log.includes('Gzipped size:'))).toBeTruthy();
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
    expect(logs.some((log) => log.includes('Total size:'))).toBeFalsy();
    expect(logs.some((log) => log.includes('Gzipped size:'))).toBeFalsy();
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
});
