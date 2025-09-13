import { expect, test } from '@e2e/helper';

test('should resolve relative asset correctly in SCSS file', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toContain('background-image:url(/static/image/icon');
});
