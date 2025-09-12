import { readFileSync } from 'node:fs';

import { expect, test } from '@e2e/helper';

test('should add id prefix after svgo minification', async ({ buildOnly }) => {
  const rsbuild = await buildOnly();

  const files = rsbuild.getDistFiles();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('/index.') && file.endsWith('.js'),
  );
  const content = readFileSync(indexJs!, 'utf-8');

  expect(
    content.includes('"linearGradient",{id:"idPrefix_svg__a"'),
  ).toBeTruthy();
});
