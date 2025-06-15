import path from 'node:path';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginSvelte } from '@rsbuild/plugin-svelte';

const buildFixture = (
  rootDir: string,
  entry: string,
): ReturnType<typeof build> => {
  const root = path.join(__dirname, rootDir);

  return build({
    cwd: root,
    runServer: true,
    plugins: [pluginSvelte()],
    rsbuildConfig: {
      source: {
        entry: {
          index: path.join(root, entry),
        },
      },
    },
  });
};

rspackOnlyTest(
  'should build basic svelte component properly',
  async ({ page }) => {
    const rsbuild = await buildFixture('basic', 'src/index.js');

    await gotoPage(page, rsbuild);

    const title = page.locator('#title');

    await expect(title).toHaveText('Hello world!');

    await rsbuild.close();
  },
);

// test cases for CSS preprocessors
for (const name of ['less', 'scss', 'stylus']) {
  rspackOnlyTest(
    `should build svelte component with ${name}`,
    async ({ page }) => {
      const rsbuild = await buildFixture(name, 'src/index.js');

      await gotoPage(page, rsbuild);

      const title = page.locator('#title');

      await expect(title).toHaveText('Hello world!');
      // use the text color to assert the compilation result
      await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');

      await rsbuild.close();
    },
  );
}
