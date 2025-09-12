import { expect, test } from '@e2e/helper';

test('should throw error when `output.target` is invalid', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
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
});
