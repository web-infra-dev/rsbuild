import path from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

test('babel', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    runServer: true,
    rsbuildConfig: {
      tools: {
        babel(_, { addPlugins }) {
          addPlugins([require('./plugins/myBabelPlugin')]);
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  expect(await page.evaluate('window.b')).toBe(10);

  rsbuild.close();
});

test('babel exclude', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    runServer: true,
    rsbuildConfig: {
      tools: {
        babel(_, { addPlugins, addExcludes }) {
          addPlugins([require('./plugins/myBabelPlugin')]);
          addExcludes(/aa/);
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  expect(await page.evaluate('window.b')).toBe(10);
  expect(await page.evaluate('window.bb')).toBeUndefined();

  rsbuild.close();
});
