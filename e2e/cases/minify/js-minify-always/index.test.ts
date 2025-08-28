import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to minify JS in development mode',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        output: {
          minify: {
            js: 'always',
          },
        },
        dev: {
          writeToDisk: true,
        },
      },
    });

    await page.waitForFunction('window.a', undefined, { timeout: 1000 });

    const files = await rsbuild.getDistFiles();
    const content =
      files[
        Object.keys(files).find(
          (file) => file.endsWith('.js') && file.includes('src_index_js'),
        )!
      ];

    expect(content).toContain('function(){window.a=1}');
  },
);
