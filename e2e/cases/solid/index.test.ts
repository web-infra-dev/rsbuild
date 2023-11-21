import path from 'path';
import { expect } from '@playwright/test';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { rspackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';

const buildFixture = (rootDir: string): ReturnType<typeof build> => {
  const root = path.join(__dirname, rootDir);
  const plugins = [pluginBabel(), pluginSolid()];

  if (rootDir === 'stylus') plugins.push(pluginStylus());

  return build({
    cwd: root,
    runServer: true,
    plugins,
  });
};

rspackOnlyTest(
  'should build basic solid component properly',
  async ({ page }) => {
    const handle = await buildFixture('basic');

    await page.goto(getHrefByEntryName('index', handle.port));

    const button = page.locator('#button');

    await expect(button).toHaveText('count: 0');

    button.click();

    await expect(button).toHaveText('count: 1');

    handle.close();
  },
);

rspackOnlyTest(
  'should build solid component with typescript',
  async ({ page }) => {
    const handle = await buildFixture('ts');

    await page.goto(getHrefByEntryName('index', handle.port));

    const button = page.locator('#button');

    await expect(button).toHaveText('count: 0');

    button.click();

    await expect(button).toHaveText('count: 1');

    handle.close();
  },
);

// test cases for css preprocessors
['less', 'scss', 'stylus'].forEach((name) => {
  rspackOnlyTest(
    `should build solid component with ${name}`,
    async ({ page }) => {
      const handle = await buildFixture(name);

      await page.goto(getHrefByEntryName('index', handle.port));

      const title = page.locator('#title');

      await expect(title).toHaveText('Hello World!');
      // use the text color to assert the compilation result
      await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');

      handle.close();
    },
  );
});
