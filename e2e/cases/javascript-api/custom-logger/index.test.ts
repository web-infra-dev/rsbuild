import { test, expect } from '@playwright/test';
import { build } from '@scripts/shared';
import { proxyConsole } from '@scripts/helper';

test('should allow to customize logger', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  await build({
    cwd: __dirname,
  });

  expect(
    logs.find((item) => item.includes('[READY] Client compiled in')),
  ).toBeTruthy();

  restore();
});
