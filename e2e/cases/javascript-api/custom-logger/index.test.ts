import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow to customize logger', async () => {
  const { logs, restore } = proxyConsole('log');

  await build({
    cwd: __dirname,
  });

  expect(logs.find((item) => item.includes('[READY] built in'))).toBeTruthy();

  restore();
});
