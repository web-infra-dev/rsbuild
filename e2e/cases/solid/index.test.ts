import path from 'node:path';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginStylus } from '@rsbuild/plugin-stylus';

const buildFixture = (rootDir: string): ReturnType<typeof build> => {
  const root = path.join(__dirname, rootDir);
  const plugins = [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginSolid(),
  ];

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
    const rsbuild = await buildFixture('basic');

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');

    await button.click();
    await expect(button).toHaveText('count: 1');
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should build solid component with typescript',
  async ({ page }) => {
    const rsbuild = await buildFixture('ts');

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');

    await button.click();
    await expect(button).toHaveText('count: 1');
    await rsbuild.close();
  },
);

// test cases for CSS preprocessors
for (const name of ['less', 'scss', 'stylus']) {
  rspackOnlyTest(
    `should build solid component with ${name}`,
    async ({ page }) => {
      const rsbuild = await buildFixture(name);

      await gotoPage(page, rsbuild);

      const title = page.locator('#title');

      await expect(title).toHaveText('Hello World!');
      // use the text color to assert the compilation result
      await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');

      await rsbuild.close();
    },
  );
}
