import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// TODO Rspack does not supports extends browserslist yet
test.fail('extends browserslist and downgrade the syntax', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();

  const indexFile =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  expect(indexFile.includes('async ')).toBeFalsy();
});
