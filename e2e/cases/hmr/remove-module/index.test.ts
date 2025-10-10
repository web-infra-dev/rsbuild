import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';
import { copy, remove } from 'fs-extra';

rspackTest(
  'should recover after a missing module is restored',
  async ({ page, dev, logHelper, copySrcDir }) => {
    const tempSrc = await copySrcDir();

    await dev({
      config: {
        source: {
          entry: {
            index: join(tempSrc, 'index.js'),
          },
        },
      },
    });

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    await button.click();
    await expect(button).toHaveText('count: 1');

    await remove(join(tempSrc, 'Button.jsx'));
    await logHelper.expectLog(`Can't resolve './Button'`);

    logHelper.clearLogs();
    await copy(join(__dirname, 'src/Button.jsx'), join(tempSrc, 'Button.jsx'));
    await logHelper.expectBuildEnd();
    await expect(page.locator('#button')).toHaveText('count: 0');
  },
);
