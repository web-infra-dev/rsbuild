import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// TODO not supported yet
test.skip('should compile const enum correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        polyfill: 'off',
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => /index\.\w+\.js/.test(file))!];

  expect(content.includes('console.log("fish is :",0)')).toBeTruthy();
});
