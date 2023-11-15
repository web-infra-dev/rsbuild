import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should compile CSS modules with :global() correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /.*\{position:relative\}.* \.bar,.* \.baz\{height:100%;overflow:hidden\}.* \.lol{width:80%}/,
  );
});
