import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should throw error by default (exportsPresence error)', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
    rsbuildConfig: {
      output: {
        // @ts-expect-error test invalid target
        target: 'foo',
      },
    },
  });

  expect(rsbuild.buildError?.message).toContain(
    `Invalid value of output.target config: "foo"`,
  );

  await rsbuild.close();
});
