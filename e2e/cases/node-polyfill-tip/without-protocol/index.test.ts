import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should print tips if resolve Node.js builtin module failed', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(
    '"querystring" is a built-in Node.js module and cannot be imported in client-side code.',
  );
  await rsbuild.close();
});
