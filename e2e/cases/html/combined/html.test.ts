import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';
import { build } from '@e2e/helper';

test.describe('should combine multiple html config correctly', () => {
  let rsbuild: Awaited<ReturnType<typeof build>>;
  let mainContent: string;
  let fooContent: string;

  test.beforeAll(async () => {
    rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
        source: {
          entry: {
            main: join(__dirname, 'src/index.js'),
            foo: join(__dirname, 'src/foo.js'),
          },
        },
        html: {
          meta: {
            description: 'a description of the page',
          },
          inject: 'body',
          appIcon: './src/assets/icon.png',
          favicon: './src/assets/icon.png',
        },
      },
    });

    mainContent = await fse.readFile(
      join(rsbuild.distPath, 'main.html'),
      'utf-8',
    );
    fooContent = await fse.readFile(
      join(rsbuild.distPath, 'foo.html'),
      'utf-8',
    );
  });

  test.afterAll(async () => {
    await rsbuild.close();
  });

  test('appicon', async () => {
    const [, iconRelativePath] =
      /<link.*rel="apple-touch-icon".*href="(.*?)">/.exec(mainContent) || [];

    expect(iconRelativePath).toBeDefined();

    const iconPath = join(rsbuild.distPath, iconRelativePath);
    expect(fse.existsSync(iconPath)).toBeTruthy();

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
    expect(fse.existsSync(iconPath)).toBeTruthy();

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
});
