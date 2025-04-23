import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to configure options of CSSExtractPlugin', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.getDistFiles();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('my-css.css'))!];

  expect(content).toEqual('body{color:red}');
});
