import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

const cwd = __dirname;

test.describe('should print file size correctly', async () => {
  const originalLog = console.log;
  let consoleOutput = '';

  test.beforeEach(() => {
    consoleOutput = '';
    console.log = (...output) => {
      consoleOutput += `${output.join(' ')}\n`;
    };
  });

  test.afterEach(() => {
    console.log = originalLog;
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
    expect(consoleOutput).toContain('index.html');
    expect(consoleOutput).toContain('Total size:');
    expect(consoleOutput).toContain('Gzipped size:');
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
    expect(consoleOutput).not.toContain('index.html');
    expect(consoleOutput).not.toContain('Total size:');
    expect(consoleOutput).not.toContain('Gzipped size:');
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
    expect(consoleOutput).not.toContain('index.html');
    expect(consoleOutput).toContain('Total size:');
    expect(consoleOutput).toContain('Gzipped size:');
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
    expect(consoleOutput).toContain('index.html');
    expect(consoleOutput).not.toContain('Total size:');
    expect(consoleOutput).not.toContain('Gzipped size:');
  });
});
