import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

test('should compile Node addons correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const addonFile = Object.keys(files).find((file) => file.endsWith('a.node'));

  expect(addonFile?.includes('server/a.node')).toBeTruthy();
});
