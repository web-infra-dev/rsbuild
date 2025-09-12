import path from 'node:path';
import type { BuildOptions, BuildResult } from '@e2e/helper';
import { expect, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { pluginSvelte } from '@rsbuild/plugin-svelte';

const buildFixture = (
  buildOnly: (options?: BuildOptions) => Promise<BuildResult>,
  rootDir: string,
  entry: string,
): Promise<BuildResult> => {
  const root = path.join(__dirname, rootDir);

  return buildOnly({
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
  async ({ page, buildOnly }) => {
    const rsbuild = await buildFixture(buildOnly, 'basic', 'src/index.js');

    await gotoPage(page, rsbuild);

    const title = page.locator('#title');

    await expect(title).toHaveText('Hello world!');
  },
);

// test cases for CSS preprocessors
for (const name of ['less', 'scss', 'stylus']) {
  rspackOnlyTest(
    `should build svelte component with ${name}`,
    async ({ page, buildOnly }) => {
      const rsbuild = await buildFixture(buildOnly, name, 'src/index.js');

      await gotoPage(page, rsbuild);

      const title = page.locator('#title');

      await expect(title).toHaveText('Hello world!');
      // use the text color to assert the compilation result
      await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');
    },
  );
}
