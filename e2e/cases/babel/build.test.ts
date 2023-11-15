import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginBabel } from '@rsbuild/plugin-babel';

test('babel', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    plugins: [
      pluginBabel((_, { addPlugins }) => {
        addPlugins([require('./plugins/myBabelPlugin')]);
      }),
    ],
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

  await rsbuild.close();
});

test('babel exclude', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    plugins: [
      pluginBabel((_, { addPlugins, addExcludes }) => {
        addPlugins([require('./plugins/myBabelPlugin')]);
        addExcludes(/aa/);
      }),
    ],
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

  await rsbuild.close();
});
