import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should compile CSS with alias correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /\.the-a-class{color:red;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}\.the-b-class{color:blue;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}\.the-c-class{color:yellow;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}/,
  );
});
