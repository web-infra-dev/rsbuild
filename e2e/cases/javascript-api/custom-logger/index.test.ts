import { expect } from '@playwright/test';
import { build, rspackOnlyTest, proxyConsole } from '@e2e/helper';

rspackOnlyTest('should allow to customize logger', async () => {
  const { logs, restore } = proxyConsole('log');

  await build({
    cwd: __dirname,
  });

  expect(
    logs.find((item) => item.includes('[READY] Client compiled in')),
  ).toBeTruthy();

  restore();
});
