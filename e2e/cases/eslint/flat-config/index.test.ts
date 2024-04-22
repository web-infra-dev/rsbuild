import { build } from '@e2e/helper';
import { proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should throw error when exist ESLint errors', async () => {
  const { logs, restore } = proxyConsole();
  await expect(
    build({
      cwd: __dirname,
    }),
  ).rejects.toThrowError('build failed!');

  expect(
    logs.find((log) => log.includes(`'undefinedVar' is not defined`)),
  ).toBeTruthy();

  restore();
});
