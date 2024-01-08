import { readFileSync } from 'fs';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should add id prefix after svgo minification', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('/index.') && file.endsWith('.js'),
  );
  const content = readFileSync(indexJs!, 'utf-8');

  expect(
    content.includes('"linearGradient",{id:"idPrefix_svg__a"'),
  ).toBeTruthy();
});
