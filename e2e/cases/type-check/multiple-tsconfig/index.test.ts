import { build } from '@e2e/helper';
import { proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should check multiple tsconfig.json as expected', async () => {
  const { logs, restore } = proxyConsole();
  await expect(
    build({
      cwd: __dirname,
    }),
  ).rejects.toThrowError('build failed!');

  expect(
    logs.find((log) =>
      log.includes(
        `Argument of type 'string' is not assignable to parameter of type 'number'.`,
      ),
    ),
  ).toBeTruthy();

  expect(
    logs.find((log) =>
      log.includes(
        `Argument of type '{}' is not assignable to parameter of type 'number'.`,
      ),
    ),
  ).toBeTruthy();

  restore();
});
