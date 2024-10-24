import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should print tips if resolve Node.js builtin module failed', async () => {
  const { logs, restore } = proxyConsole();

  try {
    await build({ cwd: __dirname });
  } catch (err) {}

  restore();
  expect(
    logs.some((log) =>
      log.includes(
        '"querystring" is a built-in Node.js module. It cannot be imported in client-side code.',
      ),
    ),
  );
});
