import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

test('should allow to set alias by build target', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const fileNames = Object.keys(files);
  const webIndex = fileNames.find(
    (file) => file.includes('static/js') && file.includes('index.js'),
  );
  const nodeIndex = fileNames.find((file) => file.includes('server/index'));

  expect(files[webIndex!]).toContain('for web target');
  expect(files[nodeIndex!]).toContain('for node target');
});
