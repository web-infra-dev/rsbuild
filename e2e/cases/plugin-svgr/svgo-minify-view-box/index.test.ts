import { readFileSync } from 'node:fs';

import { expect, test } from '@e2e/helper';

test('should preserve viewBox after svgo minification', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly();
  const files = rsbuild.getDistFiles();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('/index.') && file.endsWith('.js'),
  );
  const content = readFileSync(indexJs!, 'utf-8');

  expect(
    content.includes('width:120,height:120,viewBox:"0 0 120 120"'),
  ).toBeTruthy();
});
