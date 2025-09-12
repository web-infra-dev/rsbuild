import fs from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

const buildAndRead = async (buildOnly: any) => {
  const rsbuild = await buildOnly({
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

  const mainContent = await fs.promises.readFile(
    join(rsbuild.distPath, 'main.html'),
    'utf-8',
  );
  const fooContent = await fs.promises.readFile(
    join(rsbuild.distPath, 'foo.html'),
    'utf-8',
  );

  return { rsbuild, mainContent, fooContent };
};

test.describe('should combine multiple html config correctly', () => {
  test('should inject Apple touch icons', async ({ buildOnly }) => {
    const { rsbuild, mainContent, fooContent } = await buildAndRead(buildOnly);

    const [, iconRelativePath] =
      /<link rel="apple-touch-icon" sizes="180x180" href="(.*?)">/.exec(
        mainContent,
      ) || [];

    expect(iconRelativePath).toBeDefined();

    const iconPath = join(rsbuild.distPath, iconRelativePath);
    expect(fs.existsSync(iconPath)).toBeTruthy();

    expect(
      /<link.*rel="apple-touch-icon".*href="(.*?)">/.test(fooContent),
    ).toBeTruthy();
  });

  test('should inject favicon links', async ({ buildOnly }) => {
    const { rsbuild, mainContent, fooContent } = await buildAndRead(buildOnly);

    const [, iconRelativePath] =
      /<link.*rel="icon".*href="(.*?)">/.exec(mainContent) || [];

    expect(iconRelativePath).toBeDefined();

    const iconPath = join(rsbuild.distPath, iconRelativePath);
    expect(fs.existsSync(iconPath)).toBeTruthy();

    expect(/<link.*rel="icon".*href="(.*?)">/.test(fooContent)).toBeTruthy();
  });

  test('should inject scripts into the body when configured', async ({
    buildOnly,
  }) => {
    const { mainContent } = await buildAndRead(buildOnly);
    expect(
      /<head>[\s\S]*<script[\s\S]*>[\s\S]*<\/head>/.test(mainContent),
    ).toBeFalsy();
    expect(
      /<body>[\s\S]*<script[\s\S]*>[\s\S]*<\/body>/.test(mainContent),
    ).toBeTruthy();
  });

  test('should inject custom meta tags', async ({ buildOnly }) => {
    const { mainContent } = await buildAndRead(buildOnly);
    expect(
      /<meta name="description" content="a description of the page">/.test(
        mainContent,
      ),
    ).toBeTruthy();
  });
});
