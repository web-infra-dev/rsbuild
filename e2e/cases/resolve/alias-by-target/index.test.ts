import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to set alias by build target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const fileNames = Object.keys(files);
  const webIndex = fileNames.find(
    (file) => file.includes('static/js') && file.endsWith('index.js'),
  );
  const nodeIndex = fileNames.find(
    (file) => file.includes('server/index') && file.endsWith('index.js'),
  );

  expect(files[webIndex!]).toContain('for web target');
  expect(files[nodeIndex!]).toContain('for node target');
});
