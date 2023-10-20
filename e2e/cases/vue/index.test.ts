import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginVueJsx } from '@rsbuild/plugin-vue-jsx';

test('should build basic Vue sfc correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-basic');

  const rsbuild = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [pluginVue()],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const button1 = page.locator('#button1');
  const button2 = page.locator('#button2');

  await expect(button1).toHaveText('A: 0');
  await expect(button2).toHaveText('B: 0');

  rsbuild.close();
});

test('should build Vue sfc style correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-style');

  const rsbuild = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [pluginVue()],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const button = page.locator('#button');
  await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');

  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 255)');

  rsbuild.close();
});

test('should build basic Vue jsx correctly', async ({ page }) => {
  const root = join(__dirname, 'jsx-basic');

  const rsbuild = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [pluginVue(), pluginVueJsx()],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const button1 = page.locator('#button1');
  await expect(button1).toHaveText('A: 0');

  rsbuild.close();
});

test('should build Vue sfc with lang="ts" correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-lang-ts');

  const rsbuild = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [pluginVue()],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const button = page.locator('#button');
  await expect(button).toHaveText('count: 0 foo: bar');

  rsbuild.close();
});

test('should build Vue sfc with lang="jsx" correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-lang-jsx');

  const rsbuild = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [pluginVue(), pluginVueJsx()],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const button = page.locator('#button');
  await expect(button).toHaveText('0');

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('Foo');

  rsbuild.close();
});

test('should build Vue sfc with lang="tsx" correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-lang-tsx');

  const rsbuild = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [pluginVue(), pluginVueJsx()],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const button = page.locator('#button');
  await expect(button).toHaveText('0');

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('Foo');

  rsbuild.close();
});
