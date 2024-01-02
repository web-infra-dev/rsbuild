import { test, expect } from '@playwright/test';
import { dev } from '@scripts/shared';
import { proxyConsole } from '@scripts/helper';

const cwd = __dirname;

test('should allow to customize logger', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: true,
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  expect(logs.includes('[START] Compiling...')).toBeTruthy();
  expect(
    logs.find((item) => item.includes('[READY] Client compiled in')),
  ).toBeTruthy();

  await rsbuild.server.close();
  restore();
});
