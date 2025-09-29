import path, { join } from 'node:path';
import { gotoPage, rspackTest } from '@e2e/helper';
import fse from 'fs-extra';

rspackTest(
  'should not output the same error log consecutively',
  async ({ devOnly, page, editFile }) => {
    const tempDir = path.join(__dirname, 'test-temp-src');
    const srcDir = path.join(__dirname, 'src');
    await fse.copy(srcDir, tempDir);

    const rsbuild = await devOnly({
      config: {
        source: {
          entry: {
            index: join(tempDir, 'index.js'),
          },
        },
      },
    });

    // initial build
    await gotoPage(page, rsbuild, '/', { hash: 'test1' });
    await rsbuild.expectLog('Error: value is #test1');
    rsbuild.clearLogs();

    // change hash
    await gotoPage(page, rsbuild, '/', { hash: 'test2' });
    await page.reload();
    await rsbuild.expectLog('Error: value is #test2');
    rsbuild.expectNoLog('Error: value is #test1');
    rsbuild.clearLogs();

    // after rebuild, logs can be printed again
    await editFile(join(tempDir, 'index.js'), (content) =>
      content.replace('value', 'value2'),
    );
    await rsbuild.expectLog('Error: value2 is #test2');
    await gotoPage(page, rsbuild, '/', { hash: 'test1' });
    await page.reload();
    await rsbuild.expectLog('Error: value2 is #test1');
  },
);
