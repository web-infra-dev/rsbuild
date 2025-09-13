import { expect, test } from '@e2e/helper';

test('should allow to configure options of CSSExtractPlugin', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('my-css.css'))!];

  expect(content).toEqual('body{color:red}');
});
