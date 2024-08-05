import { join } from 'node:path';
import { build, globContentJSON } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to custom HTML filename', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const outputs = await globContentJSON(join(__dirname, 'dist'));
  expect(outputs[join(rsbuild.distPath, 'custom-foo.html')]).toBeTruthy();
  expect(outputs[join(rsbuild.distPath, 'custom-bar.html')]).toBeTruthy();
});
