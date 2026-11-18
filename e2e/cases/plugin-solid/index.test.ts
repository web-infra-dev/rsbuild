import path from 'node:path';
import type { BuildOptions, BuildResult } from '@e2e/helper';
import { expect, gotoPage, test } from '@e2e/helper';
import { pluginSolid } from '@rsbuild/plugin-solid';

const buildFixture = (
  build: (options?: BuildOptions) => Promise<BuildResult>,
  rootDir: string,
): Promise<BuildResult> => {
  const root = path.join(import.meta.dirname, rootDir);

  return build({
    cwd: root,
    runServer: true,
    config: {
      plugins: [pluginSolid()],
    },
  });
};

test('should build basic solid component properly', async ({ page, build }) => {
  const rsbuild = await buildFixture(build, 'basic');

  await gotoPage(page, rsbuild);

  const button = page.locator('#button');
  await expect(button).toHaveText('count: 0');

  await button.click();
  await expect(button).toHaveText('count: 1');
});

test('should use the production Solid runtime without Solid Refresh when dev is false', async ({
  devOnly,
}) => {
  const rsbuild = await devOnly({
    cwd: path.join(import.meta.dirname, 'basic'),
    config: { plugins: [pluginSolid({ dev: false })] },
  });
  const stats = await rsbuild.server!.environments.web.getStats();
  const modules = stats.toJson({ all: false, modules: true }).modules;
  const names = modules?.map((mod) => mod.name).join('\n');

  expect(names).toContain('solid-js/dist/solid.js');
  expect(names).toContain('@solidjs/web/dist/web.js');
  expect(names).not.toContain('solid-js/dist/refresh');
});

test('should build solid component with typescript', async ({
  page,
  build,
}) => {
  const rsbuild = await buildFixture(build, 'ts');

  await gotoPage(page, rsbuild);

  const button = page.locator('#button');
  await expect(button).toHaveText('count: 0');

  await button.click();
  await expect(button).toHaveText('count: 1');
});

// test cases for CSS preprocessors
for (const name of ['less', 'scss']) {
  test(`should build solid component with ${name}`, async ({ page, build }) => {
    const rsbuild = await buildFixture(build, name);

    await gotoPage(page, rsbuild);

    const title = page.locator('#title');

    await expect(title).toHaveText('Hello World!');
    // use the text color to assert the compilation result
    await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');
  });
}
