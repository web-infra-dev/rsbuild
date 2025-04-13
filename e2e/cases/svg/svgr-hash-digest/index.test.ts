import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// https://github.com/web-infra-dev/rsbuild/issues/4610
test('should generate the same hash digest for the same SVG', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).filter((key) => key.endsWith('.svg')).length,
  ).toEqual(1);

  await rsbuild.close();
});
