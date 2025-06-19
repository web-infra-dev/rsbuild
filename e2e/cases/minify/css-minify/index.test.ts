import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to minify CSS in development mode',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        output: {
          minify: {
            css: 'always',
          },
        },
        dev: {
          writeToDisk: true,
        },
      },
    });

    const files = await rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toEqual(
      '.a{text-align:center;text-align:center;font-size:1.5rem;line-height:1.5}.b{text-align:center;background:#fafafa;font-size:1.5rem;line-height:1.5}',
    );
  },
);
