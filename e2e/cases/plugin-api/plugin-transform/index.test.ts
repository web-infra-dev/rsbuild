import { test, expect } from '@playwright/test';
import { build } from '@e2e/helper';

test('should allow plugin to transform code', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js'),
  );
  const indexCss = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.css'),
  );

  expect(files[indexJs!].includes('world')).toBeTruthy();
  expect(files[indexCss!].includes('blue')).toBeTruthy();
});
