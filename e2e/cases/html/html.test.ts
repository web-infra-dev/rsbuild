import { join } from 'path';
import { expect, test } from '@playwright/test';
import { fs } from '@rsbuild/shared/fs-extra';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test.describe('html configure multi', () => {
  let rsbuild: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    rsbuild = await build({
      cwd: join(fixtures, 'mount-id'),
      entry: {
        main: join(join(fixtures, 'mount-id'), 'src/index.ts'),
      },
      runServer: true,
      plugins: [pluginReact()],
      rsbuildConfig: {
        html: {
          mountId: 'app',
        },
      },
    });
  });

  test.afterAll(() => {
    rsbuild.close();
  });

  test('mountId', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(getHrefByEntryName('main', rsbuild.port));

    const test = page.locator('#test');
    await expect(test).toHaveText('Hello Rsbuild!');

    expect(errors).toEqual([]);
  });

  test('inject default (head)', async () => {
    const pagePath = join(rsbuild.distPath, 'main.html');
    const content = await fs.readFile(pagePath, 'utf-8');

    expect(
      /<head>[\s\S]*<script[\s\S]*>[\s\S]*<\/head>/.test(content),
    ).toBeTruthy();
    expect(
      /<body>[\s\S]*<script[\s\S]*>[\s\S]*<\/body>/.test(content),
    ).toBeFalsy();
  });
});

test.describe('html element set', () => {
  let rsbuild: Awaited<ReturnType<typeof build>>;
  let mainContent: string;
  let fooContent: string;

  test.beforeAll(async () => {
    rsbuild = await build({
      cwd: join(fixtures, 'template'),
      entry: {
        main: join(join(fixtures, 'template'), 'src/index.ts'),
        foo: join(fixtures, 'template/src/index.ts'),
      },
      runServer: true,
      rsbuildConfig: {
        html: {
          meta: {
            description: 'a description of the page',
          },
          inject: 'body',
          crossorigin: 'anonymous',
          appIcon: './src/assets/icon.png',
          favicon: './src/assets/icon.png',
        },
      },
    });

    mainContent = await fs.readFile(
      join(rsbuild.distPath, 'main.html'),
      'utf-8',
    );
    fooContent = await fs.readFile(join(rsbuild.distPath, 'foo.html'), 'utf-8');
  });

  test.afterAll(() => {
    rsbuild.close();
  });

  test('appicon', async () => {
    const [, iconRelativePath] =
      /<link.*rel="apple-touch-icon".*href="(.*?)">/.exec(mainContent) || [];

    expect(iconRelativePath).toBeDefined();

    const iconPath = join(rsbuild.distPath, iconRelativePath);
    expect(fs.existsSync(iconPath)).toBeTruthy();

    // should work on all page
    expect(
      /<link.*rel="apple-touch-icon".*href="(.*?)">/.test(fooContent),
    ).toBeTruthy();
  });

  test('favicon', async () => {
    const [, iconRelativePath] =
      /<link.*rel="icon".*href="(.*?)">/.exec(mainContent) || [];

    expect(iconRelativePath).toBeDefined();

    const iconPath = join(rsbuild.distPath, iconRelativePath);
    expect(fs.existsSync(iconPath)).toBeTruthy();

    // should work on all page
    expect(/<link.*rel="icon".*href="(.*?)">/.test(fooContent)).toBeTruthy();
  });

  test('custom inject', async () => {
    expect(
      /<head>[\s\S]*<script[\s\S]*>[\s\S]*<\/head>/.test(mainContent),
    ).toBeFalsy();
    expect(
      /<body>[\s\S]*<script[\s\S]*>[\s\S]*<\/body>/.test(mainContent),
    ).toBeTruthy();
  });

  test('custom meta', async () => {
    expect(
      /<meta name="description" content="a description of the page">/.test(
        mainContent,
      ),
    ).toBeTruthy();
  });

  test('custom crossorigin', async () => {
    const allScripts = /(<script [\s\S]*?>)/g.exec(mainContent);

    expect(
      allScripts?.every((data) => data.includes('crossorigin="anonymous"')),
    ).toBeTruthy();
  });
});

test('template & templateParameters', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      html: {
        template: './static/index.html',
        templateParameters: {
          foo: 'bar',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const testTemplate = page.locator('#test-template');
  await expect(testTemplate).toHaveText('xxx');

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  await expect(page.evaluate(`window.foo`)).resolves.toBe('bar');

  rsbuild.close();
});

test('html.outputStructure', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      html: {
        outputStructure: 'nested',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const pagePath = join(rsbuild.distPath, 'main/index.html');

  expect(fs.existsSync(pagePath)).toBeTruthy();

  rsbuild.close();
});

test('tools.htmlPlugin', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      tools: {
        htmlPlugin(config, { entryName }) {
          if (entryName === 'main') {
            config.scriptLoading = 'module';
          }
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const pagePath = join(rsbuild.distPath, 'main.html');
  const content = await fs.readFile(pagePath, 'utf-8');

  const allScripts = /(<script [\s\S]*?>)/g.exec(content);

  expect(
    allScripts?.every((data) => data.includes('type="module"')),
  ).toBeTruthy();

  rsbuild.close();
});
