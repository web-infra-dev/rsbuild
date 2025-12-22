import { join } from 'node:path';
import { expect, MODULE_BUILD_FAILED_LOG, OVERLAY_ID, test } from '@e2e/helper';

test('should hide overlay after resolving error', async ({
  page,
  dev,
  editFile,
  logHelper,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();
  await dev({
    config: {
      source: {
        entry: {
          index: join(tempSrc, 'index.jsx'),
        },
      },
    },
  });

  await editFile(join(tempSrc, 'App.jsx'), (code) =>
    code.replace('</div>', '</aaaaa>'),
  );
  await logHelper.expectLog(MODULE_BUILD_FAILED_LOG);

  logHelper.clearLogs();
  await editFile(join(tempSrc, 'App.jsx'), (code) =>
    code.replace('</aaaa>', '</div>'),
  );
  logHelper.expectBuildEnd();

  expect(await page.locator(OVERLAY_ID).isVisible()).toBeFalsy();
});
