import fs from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

const cwd = __dirname;

test('should show overlay correctly', async ({
  page,
  dev,
  editFile,
  logHelper,
}) => {
  await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
    recursive: true,
  });

  const { expectLog, addLog } = logHelper;

  page.on('console', (consoleMessage) => {
    addLog(consoleMessage.text());
  });

  await dev({
    config: {
      source: {
        entry: {
          index: join(cwd, 'test-temp-src/index.tsx'),
        },
      },
    },
  });

  await expectLog('[rsbuild] WebSocket connected.');

  const errorOverlay = page.locator('rsbuild-error-overlay');
  expect(await errorOverlay.locator('.title').count()).toBe(0);

  await editFile('test-temp-src/App.tsx', (code) =>
    code.replace('</div>', '</aaaaa>'),
  );

  await expectLog('Module build failed');
  await expect(errorOverlay.locator('.title')).toHaveText('Build failed');
});
