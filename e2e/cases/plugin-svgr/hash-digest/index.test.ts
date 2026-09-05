import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

// https://github.com/web-infra-dev/rsbuild/issues/4610
test('should generate the same hash digest for the same SVG', async ({
  buildPreview,
}) => {
  const rsbuild = await buildPreview();

  const files = rsbuild.getDistFiles();

  expect(findFiles(files, '.svg').length).toEqual(1);
});
