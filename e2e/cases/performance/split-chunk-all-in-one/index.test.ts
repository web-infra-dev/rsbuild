import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('chunkSplit all-in-one', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();
  // expect only one bundle (end with .js)
  const filePaths = Object.keys(files).filter((file) => file.endsWith('.js'));

  expect(filePaths.length).toBe(1);
});
