import path from 'node:path';
import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { build, dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
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

    rsbuild.close();
  },
);

rspackOnlyTest('hmr should work properly', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const root = path.join(__dirname, 'hmr');

  const rsbuild = await dev({
    cwd: root,
    plugins: [pluginSvelte()],
    rsbuildConfig: {
      source: {
        entry: {
          index: path.join(root, 'src/index.js'),
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const a = page.locator('#A');
  const b = page.locator('#B');

  await expect(a).toHaveText('A: 0');
  await expect(b).toHaveText('B: 0');

  await a.click({ clickCount: 5 });
  await expect(a).toHaveText('A: 5');
  await expect(b).toHaveText('B: 5');

  // simulate a change to component B's source code
  const bPath = path.join(root, 'src/B.svelte');
  const sourceCodeB = fs.readFileSync(bPath, 'utf-8');
  fs.writeFileSync(bPath, sourceCodeB.replace('B:', 'Beep:'), 'utf-8');

  // content of B changed to `Beap: 5` means HMR has taken effect
  await expect(b).toHaveText('Beep: 5');
  // the state (count) of A should be kept
  await expect(a).toHaveText('A: 5');

  fs.writeFileSync(bPath, sourceCodeB, 'utf-8'); // recover the source code
  rsbuild.server.close();
});

rspackOnlyTest(
  'should build svelte component with typescript',
  async ({ page }) => {
    const rsbuild = await buildFixture('ts', 'src/index.ts');

    await gotoPage(page, rsbuild);

    const title = page.locator('#title');

    await expect(title).toHaveText('Hello world!');

    rsbuild.close();
  },
);

// test cases for css preprocessors
['less', 'scss', 'stylus'].forEach((name) => {
  rspackOnlyTest(
    `should build svelte component with ${name}`,
    async ({ page }) => {
      const rsbuild = await buildFixture(name, 'src/index.js');

      await gotoPage(page, rsbuild);

      const title = page.locator('#title');

      await expect(title).toHaveText('Hello world!');
      // use the text color to assert the compilation result
      await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');

      rsbuild.close();
    },
  );
});
