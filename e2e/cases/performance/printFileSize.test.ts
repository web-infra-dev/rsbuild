import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

const cwd = join(__dirname, 'basic');

test.describe('should print file size correctly', async () => {
  let originalLog = console.log;
  let consoleOutput: string = '';

  test.beforeEach(() => {
    consoleOutput = '';
    console.log = (...output) => (consoleOutput += output.join(' ') + '\n');
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
    expect(consoleOutput).toContain('dist/static/js');
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
    expect(consoleOutput).not.toContain('dist/static/js');
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
    expect(consoleOutput).not.toContain('dist/static/js');
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
    expect(consoleOutput).toContain('dist/static/js');
    expect(consoleOutput).not.toContain('Total size:');
    expect(consoleOutput).not.toContain('Gzipped size:');
  });
});
