import { dev, expectPoll, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should display type errors on overlay correctly', async ({ page }) => {
  const { restore } = proxyConsole();

  const logs: string[] = [];
  page.on('console', (consoleMessage) => {
    logs.push(consoleMessage.text());
  });

  const rsbuild = await dev({
    cwd,
    page,
  });

  await expectPoll(() =>
    logs.some((log) => log.includes('TS2322:')),
  ).toBeTruthy();

  const errorOverlay = page.locator('rsbuild-error-overlay');

  await expect(errorOverlay.locator('.title')).toHaveText('Build failed');

  // The first span is "<span style="color:#888">TS2322: </span>"
  const firstSpan = errorOverlay.locator('span').first();
  expect(await firstSpan.textContent()).toEqual('TS2322: ');
  expect(await firstSpan.getAttribute('style')).toEqual('color:#888;');

  // The first link is "<a class="file-link">./path/to/src/index.ts:3:1</a>"
  const firstLink = errorOverlay.locator('.file-link').first();
  expect(await firstLink.getAttribute('class')).toEqual('file-link');
  const linkText = await firstLink.textContent();
  expect(
    linkText?.endsWith('/src/index.ts:3:1') && linkText.startsWith('.'),
  ).toBeTruthy();

  await rsbuild.close();

  restore();
});
