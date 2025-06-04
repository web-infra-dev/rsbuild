import { promises } from 'node:fs';
import { join } from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

test('should allow to get raw asset content with `?raw` in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.rawImg')).toEqual(
    await promises.readFile(
      join(__dirname, '../../../assets/circle.svg'),
      'utf-8',
    ),
  );

  await rsbuild.close();
});

test('should allow to get raw asset content with `?raw` in production mode', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.rawImg')).toEqual(
    await promises.readFile(
      join(__dirname, '../../../assets/circle.svg'),
      'utf-8',
    ),
  );

  await rsbuild.close();
});

test('should allow to get raw SVG content with `?raw` when using pluginSvgr', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      plugins: [pluginSvgr()],
    },
  });

  expect(await page.evaluate('window.rawImg')).toEqual(
    await promises.readFile(
      join(__dirname, '../../../assets/circle.svg'),
      'utf-8',
    ),
  );

  await rsbuild.close();
});

test('should allow to get raw JS content with `?raw`', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.rawJs')).toEqual(
    await promises.readFile(join(__dirname, 'src/foo.js'), 'utf-8'),
  );

  await rsbuild.close();
});

test('should allow to get raw TS content with `?raw`', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.rawTs')).toEqual(
    await promises.readFile(join(__dirname, 'src/bar.ts'), 'utf-8'),
  );

  await rsbuild.close();
});

test('should allow to get raw TSX content with `?raw` and using pluginReact', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      plugins: [pluginReact()],
    },
  });

  expect(await page.evaluate('window.rawTsx')).toEqual(
    await promises.readFile(join(__dirname, 'src/baz.tsx'), 'utf-8'),
  );

  await rsbuild.close();
});
