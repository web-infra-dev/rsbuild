import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

function extractFileSizeLogs(logs: string[]) {
  const result: string[] = [];

  let isFileSizeLog = false;

  for (const log of logs) {
    const trimmed = log.trim();
    const isTableHeader = trimmed.startsWith('File (');
    const isTotalSize = trimmed.startsWith('Total size');

    if (isTableHeader || isTotalSize) {
      isFileSizeLog = true;
    }
    if (isFileSizeLog) {
      // replace numbers and contenthash with placeholder
      // remove trailing spaces
      // replace Windows path seq with slash
      result.push(
        log
          .replace(/\.[a-z0-9]{8}\./g, '.[[hash]].')
          .replace(/\d+\.\d+ kB/g, 'X.X kB')
          .replace(/\s+$/gm, '')
          .replace(/\\/g, '/'),
      );
    }
    if (isTotalSize) {
      isFileSizeLog = false;
    }
  }

  return result.join('\n');
}

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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (web)                             Size       Gzip
dist/static/css/index.[[hash]].css     X.X kB    X.X kB
dist/index.html                        X.X kB    X.X kB
dist/static/js/index.[[hash]].js       X.X kB     X.X kB
dist/static/image/icon.[[hash]].png    X.X kB
dist/static/js/lib-react.[[hash]].js   X.X kB   X.X kB
                              Total:   X.X kB   X.X kB`);
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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (node)                         Size
dist/server/static/image/icon.png   X.X kB
dist/server/index.js                X.X kB
                           Total:   X.X kB
File (web)                    Size       Gzip
dist/static/css/index.css     X.X kB    X.X kB
dist/index.html               X.X kB    X.X kB
dist/static/js/index.js       X.X kB     X.X kB
dist/static/image/icon.png    X.X kB
dist/static/js/lib-react.js   X.X kB   X.X kB
                     Total:   X.X kB   X.X kB`);
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

    expect(extractFileSizeLogs(logs)).toEqual('');
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

    expect(extractFileSizeLogs(logs)).toEqual(`
Total size (web): X.X kB (X.X kB gzipped)`);
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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (web)                             Size       Gzip
dist/static/css/index.[[hash]].css     X.X kB    X.X kB
dist/index.html                        X.X kB    X.X kB
dist/static/js/index.[[hash]].js       X.X kB     X.X kB
dist/static/image/icon.[[hash]].png    X.X kB
dist/static/js/lib-react.[[hash]].js   X.X kB   X.X kB`);
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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (web)                                                 Size       Gzip
../test-temp-folder/dist/static/css/index.[[hash]].css     X.X kB    X.X kB
../test-temp-folder/dist/index.html                        X.X kB    X.X kB
../test-temp-folder/dist/static/js/index.[[hash]].js       X.X kB     X.X kB
../test-temp-folder/dist/static/image/icon.[[hash]].png    X.X kB
../test-temp-folder/dist/static/js/lib-react.[[hash]].js   X.X kB   X.X kB
                                                  Total:   X.X kB   X.X kB`);
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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (web)                             Size
dist/static/css/index.[[hash]].css     X.X kB
dist/index.html                        X.X kB
dist/static/js/index.[[hash]].js       X.X kB
dist/static/image/icon.[[hash]].png    X.X kB
dist/static/js/lib-react.[[hash]].js   X.X kB
                              Total:   X.X kB`);
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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (web)                             Size       Gzip
dist/static/js/index.[[hash]].js       X.X kB     X.X kB
dist/static/js/lib-react.[[hash]].js   X.X kB   X.X kB
                              Total:   X.X kB   X.X kB`);
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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (web)                             Size       Gzip
dist/static/js/lib-react.[[hash]].js   X.X kB   X.X kB`);
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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (web)                             Size       Gzip
dist/static/css/index.[[hash]].css     X.X kB    X.X kB
dist/static/js/index.[[hash]].js       X.X kB     X.X kB
dist/static/image/icon.[[hash]].png    X.X kB
dist/static/js/lib-react.[[hash]].js   X.X kB   X.X kB
                              Total:   X.X kB   X.X kB`);
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

    expect(extractFileSizeLogs(logs)).toEqual(`
File (web)                             Size       Gzip
dist/static/css/index.[[hash]].css     X.X kB    X.X kB
dist/index.html                        X.X kB    X.X kB
dist/static/js/index.[[hash]].js       X.X kB     X.X kB
dist/static/image/icon.[[hash]].png    X.X kB
dist/static/js/lib-react.[[hash]].js   X.X kB   X.X kB
                              Total:   X.X kB   X.X kB`);
  });
});
