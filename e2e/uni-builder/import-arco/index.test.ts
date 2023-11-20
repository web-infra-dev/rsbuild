import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

// Skipped
// we should find a better way to test it without installing antd
// TODO: uni-builder
test.skip('should import arco correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();

  expect(
    Object.keys(files).find(
      (file) => file.includes('lib-arco') && file.includes('.js'),
    ),
  ).toBeTruthy();
  expect(
    Object.keys(files).find(
      (file) => file.includes('lib-arco') && file.includes('.css'),
    ),
  ).toBeTruthy();
});
