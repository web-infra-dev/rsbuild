import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should throw error by default (exportsPresence error)', async () => {
  const { logs, restore } = proxyConsole();

  await expect(
    build({
      cwd: __dirname,
    }),
  ).rejects.toThrowError();

  restore();

  expect(
    logs.find((log) =>
      log.includes(`export 'aa' (imported as 'aa') was not found in './test'`),
    ),
  ).toBeTruthy();
});
