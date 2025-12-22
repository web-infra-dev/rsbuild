import { join } from 'node:path';
import {
  expect,
  HMR_CONNECTED_LOG,
  MODULE_BUILD_FAILED_LOG,
  OVERLAY_ID,
  OVERLAY_TITLE_BUILD_FAILED,
  test,
} from '@e2e/helper';

test('should show overlay correctly', async ({
  page,
  dev,
  editFile,
  logHelper,
  copySrcDir,
}) => {
  const tempSrc = await copySrcDir();

  const { expectLog, addLog } = logHelper;

  page.on('console', (consoleMessage) => {
    addLog(consoleMessage.text());
  });

  await dev({
    config: {
      source: {
        entry: {
          index: join(tempSrc, 'index.tsx'),
        },
      },
    },
  });

  await expectLog(HMR_CONNECTED_LOG);

  const errorOverlay = page.locator(OVERLAY_ID);
  expect(await errorOverlay.locator('.title').count()).toBe(0);

  await editFile(join(tempSrc, 'App.tsx'), (code) =>
    code.replace('</div>', '</aaaaa>'),
  );

  await expectLog(MODULE_BUILD_FAILED_LOG);
  await expect(errorOverlay.locator('.title')).toHaveText(
    OVERLAY_TITLE_BUILD_FAILED,
  );
});
