import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should compile CSS with alias correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /\.the-a-class{color:red;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}\.the-b-class{color:#00f;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}\.the-c-class{color:#ff0;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}/,
  );
});
