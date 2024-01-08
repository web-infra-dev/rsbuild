import { readFileSync } from 'fs';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should preserve viewBox after svgo minification', async () => {
  const buildOpts = {
    cwd: __dirname,
  };

  const rsbuild = await build(buildOpts);

  const files = await rsbuild.unwrapOutputJSON();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('/index.') && file.endsWith('.js'),
  );
  const content = readFileSync(indexJs!, 'utf-8');

  expect(
    content.includes('width:120,height:120,viewBox:"0 0 120 120"'),
  ).toBeTruthy();
});
