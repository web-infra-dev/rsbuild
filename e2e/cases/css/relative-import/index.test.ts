import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile CSS relative imports correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toContain('.foo{color:red}.bar{color:blue}.baz{color:green}');
});
