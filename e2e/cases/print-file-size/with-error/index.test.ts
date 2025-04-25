import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should not print file size if has errors', async () => {
  const { logs, restore } = proxyConsole();

  try {
    await build({
      cwd,
      rsbuildConfig: {
        performance: {
          printFileSize: true,
        },
      },
    });
  } catch (err) {
    expect(err).toBeTruthy();
  }

  expect(logs.some((log) => log.includes('Total:'))).toBeFalsy();
  restore();
});
