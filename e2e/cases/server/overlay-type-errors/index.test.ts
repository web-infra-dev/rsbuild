import { expect, test } from '@e2e/helper';

test('should display type errors on overlay correctly', async ({
  page,
  dev,
  logHelper,
}) => {
  const { addLog, expectLog } = logHelper;
  page.on('console', (consoleMessage) => {
    addLog(consoleMessage.text());
  });

  await dev();

  await expectLog('TS2322:');

  const errorOverlay = page.locator('rsbuild-error-overlay');
  await expect(errorOverlay.locator('.title')).toHaveText('Build failed');

  // Get "<span style="color:#888">TS2322: </span>"
  const tsSpan = errorOverlay.locator('span').getByText('TS2322: ');
  expect(await tsSpan.textContent()).toEqual('TS2322: ');
  expect(await tsSpan.getAttribute('style')).toEqual('color:#888;');

  // The first link is "<a class="file-link">./path/to/src/index.ts:3:1</a>"
  const firstLink = errorOverlay.locator('.file-link').first();
  expect(await firstLink.getAttribute('class')).toEqual('file-link');
  const linkText = await firstLink.textContent();
  expect(
    linkText?.endsWith('/src/index.ts:3:1') && linkText.startsWith('.'),
  ).toBeTruthy();
});
