import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

test('should disable error overlay when dev.client.overlay is false', async ({
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

  await expect(page.locator('rsbuild-error-overlay')).toHaveCount(0);

  await editFile(join(tempSrc, 'App.tsx'), (code) =>
    code.replace('</div>', '</aaaa>'),
  );

  await expectLog('Module build failed');
  await expect(page.locator('rsbuild-error-overlay')).toHaveCount(0);
});
