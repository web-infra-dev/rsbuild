import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

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

  await expectLog('[rsbuild] WebSocket connected.');

  const errorOverlay = page.locator('rsbuild-error-overlay');
  expect(await errorOverlay.locator('.title').count()).toBe(0);

  await editFile(join(tempSrc, 'App.tsx'), (code) =>
    code.replace('</div>', '</aaaaa>'),
  );

  await expectLog('Module build failed');
  await expect(errorOverlay.locator('.title')).toHaveText('Build failed');
});
