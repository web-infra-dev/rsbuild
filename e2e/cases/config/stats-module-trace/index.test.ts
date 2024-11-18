import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should log error module trace', async () => {
  const { restore, logs } = proxyConsole();

  await expect(
    build({
      cwd: __dirname,
      rsbuildConfig: {},
    }),
  ).rejects.toThrowError('build failed');

  expect(logs.some((log) => log.includes('@ ./src/index.tsx'))).toBeTruthy();

  restore();
});
