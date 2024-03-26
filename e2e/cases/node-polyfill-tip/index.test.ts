import { expect, test } from '@playwright/test';
import { build, proxyConsole } from '@e2e/helper';

test('should print tips if resolve Node.js builtin module failed', async () => {
  const { logs, restore } = proxyConsole();

  try {
    await build({ cwd: __dirname });
  } catch (err) {}

  restore();
  expect(
    logs.some((log) =>
      log.includes(
        '"querystring" is a built-in Node.js module and cannot be imported in client-side code',
      ),
    ),
  );
});
