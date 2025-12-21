import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should show runtime errors on overlay',
  async ({ page, dev, editFile, logHelper, copySrcDir }) => {
    const tempSrc = await copySrcDir();

    page.on('console', (consoleMessage) => {
      logHelper.addLog(consoleMessage.text());
    });

    await dev({
      config: {
        source: {
          entry: {
            index: join(tempSrc, 'index.jsx'),
          },
        },
      },
    });

    await logHelper.expectLog('[rsbuild] WebSocket connected.');

    const errorOverlay = page.locator('rsbuild-error-overlay');
    expect(await errorOverlay.locator('.title').count()).toBe(0);

    // Introduce a runtime error
    await editFile(join(tempSrc, 'App.jsx'), (code) =>
      code.replace(
        'return <div>Hello</div>',
        `
  throw new Error('Runtime error occurred');
  return <div>Hello</div>`,
      ),
    );
    await logHelper.expectLog('Runtime error occurred');
    await expect(errorOverlay.locator('.title')).toHaveText('Runtime errors');
    await expect(
      errorOverlay.getByText('Uncaught Error: Runtime error occurred'),
    ).toBeVisible();
  },
);
