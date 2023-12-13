import fs from 'fs';
import path from 'path';
import { expect } from '@playwright/test';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { rspackOnlyTest } from '@scripts/helper';
import { build, dev, getHrefByEntryName } from '@scripts/shared';

const buildFixture = (rootDir: string): ReturnType<typeof build> => {
  const root = path.join(__dirname, rootDir);
  const plugins = [
    pluginBabel({
      include: /\.(jsx|tsx)$/,
      exclude: /[\\/]node_modules[\\/]/,
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
    const handle = await buildFixture('basic');

    await page.goto(getHrefByEntryName('index', handle.port));

    const button = page.locator('#button');

    await expect(button).toHaveText('count: 0');

    button.click();

    await expect(button).toHaveText('count: 1');

    handle.close();
  },
);

rspackOnlyTest('hmr should work properly', async ({ page }) => {
  const root = path.join(__dirname, 'hmr');

  const handle = await dev({
    cwd: root,
    plugins: [
      pluginBabel({
        include: /\.(jsx|tsx)$/,
        exclude: /[\\/]node_modules[\\/]/,
      }),
      pluginSolid(),
    ],
  });

  await page.goto(getHrefByEntryName('index', handle.port));

  const a = page.locator('#A');
  const b = page.locator('#B');

  await expect(a).toHaveText('A: 0');
  await expect(b).toHaveText('B: 0');

  await a.click({ clickCount: 5 });
  await expect(a).toHaveText('A: 5');
  await expect(b).toHaveText('B: 5');

  // simulate a change to component B's source code
  const filePath = path.join(root, 'src/B.jsx');
  const sourceCodeB = fs.readFileSync(filePath, 'utf-8');
  fs.writeFileSync(filePath, sourceCodeB.replace('B:', 'Beep:'), 'utf-8');

  // content of B changed to `Beap: 5` means HMR has taken effect
  await expect(b).toHaveText('Beep: 5');
  // the state (count) of A should be kept
  await expect(a).toHaveText('A: 5');

  fs.writeFileSync(filePath, sourceCodeB, 'utf-8'); // recover the source code
  handle.server.close();
});

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
