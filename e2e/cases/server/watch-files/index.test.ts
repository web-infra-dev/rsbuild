import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { fse } from '@rsbuild/shared';
import path from 'node:path';

rspackOnlyTest(
  'page should reload when file content is changed',
  async ({ page }) => {
    const file = path.join(__dirname, '/assets/example.txt');
    const rsbuild = await dev({
      cwd: __dirname,
      rsbuildConfig: {
        dev: {
          watchFiles: file,
        },
      },
    });
    await gotoPage(page, rsbuild);

    await fse.writeFile(file, 'test');

    // check the page is reloaded
    await page.waitForResponse((response) => response.url() === page.url());

    // reset file
    fse.truncateSync(file);

    await rsbuild.close();
  },
);
