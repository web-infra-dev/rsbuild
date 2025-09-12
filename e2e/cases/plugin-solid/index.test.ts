import path from 'node:path';
import type { BuildOptions, BuildResult } from '@e2e/helper';
import { expect, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginStylus } from '@rsbuild/plugin-stylus';

const buildFixture = (
  buildOnly: (options?: BuildOptions) => Promise<BuildResult>,
  rootDir: string,
): Promise<BuildResult> => {
  const root = path.join(__dirname, rootDir);
  const plugins = [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginSolid(),
  ];

  if (rootDir === 'stylus') plugins.push(pluginStylus());

  return buildOnly({
    cwd: root,
    runServer: true,
    plugins,
  });
};

rspackOnlyTest(
  'should build basic solid component properly',
  async ({ page, buildOnly }) => {
    const rsbuild = await buildFixture(buildOnly, 'basic');

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');

    await button.click();
    await expect(button).toHaveText('count: 1');
  },
);

rspackOnlyTest(
  'should build solid component with typescript',
  async ({ page, buildOnly }) => {
    const rsbuild = await buildFixture(buildOnly, 'ts');

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');

    await button.click();
    await expect(button).toHaveText('count: 1');
  },
);

// test cases for CSS preprocessors
for (const name of ['less', 'scss', 'stylus']) {
  rspackOnlyTest(
    `should build solid component with ${name}`,
    async ({ page, buildOnly }) => {
      const rsbuild = await buildFixture(buildOnly, name);

      await gotoPage(page, rsbuild);

      const title = page.locator('#title');

      await expect(title).toHaveText('Hello World!');
      // use the text color to assert the compilation result
      await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');
    },
  );
}
