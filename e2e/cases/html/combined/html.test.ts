import fs from 'node:fs';
import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test.describe('should combine multiple html config correctly', () => {
  let rsbuild: Awaited<ReturnType<typeof build>>;
  let mainContent: string;
  let fooContent: string;

  test.beforeAll(async () => {
    rsbuild = await build({
      cwd: __dirname,
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
          appIcon: {
            icons: [{ src: '../../../assets/icon.png', size: 180 }],
          },
          favicon: '../../../assets/icon.png',
        },
      },
    });

    mainContent = await fs.promises.readFile(
      join(rsbuild.distPath, 'main.html'),
      'utf-8',
    );
    fooContent = await fs.promises.readFile(
      join(rsbuild.distPath, 'foo.html'),
      'utf-8',
    );
  });

  test('appicon', async () => {
    const [, iconRelativePath] =
      /<link rel="apple-touch-icon" sizes="180x180" href="(.*?)">/.exec(
        mainContent,
      ) || [];

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
});
