import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should throw error when `output.target` is invalid', async () => {
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
    `Invalid value of output.target: "foo", valid values are:`,
  );

  await rsbuild.close();
});
