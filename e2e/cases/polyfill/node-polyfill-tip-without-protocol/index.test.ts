import { expect, test } from '@e2e/helper';

test('should print tips if resolve Node.js builtin module failed', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(
    '"querystring" is a built-in Node.js module and cannot be imported in client-side code.',
  );
});
