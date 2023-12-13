import { join } from 'path';
import { readFileSync } from 'fs';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

test('should preserve viewBox after svgo minification', async () => {
  const fixture = join(__dirname, 'svgo-minify-view-box');
  const buildOpts = {
    cwd: fixture,
    plugins: [
      pluginReact(),
      pluginSvgr({
        svgDefaultExport: 'url',
      }),
    ],
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

test('should add id prefix after svgo minification', async () => {
  const fixture = join(__dirname, 'svgo-minify-id-prefix');
  const buildOpts = {
    cwd: fixture,
    plugins: [
      pluginReact(),
      pluginSvgr({
        svgDefaultExport: 'url',
      }),
    ],
  };

  const rsbuild = await build(buildOpts);

  const files = await rsbuild.unwrapOutputJSON();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('/index.') && file.endsWith('.js'),
  );
  const content = readFileSync(indexJs!, 'utf-8');

  expect(
    content.includes('"linearGradient",{id:"idPrefix_svg__a"}'),
  ).toBeTruthy();
});
