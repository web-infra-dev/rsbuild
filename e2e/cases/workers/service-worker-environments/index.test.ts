import { expect, gotoPage, test } from '@e2e/helper';
import type { Page } from 'playwright';

declare global {
  interface Window {
    swStatus: string;
  }
}

const waitForServiceWorker = async (page: Page, port: number) => {
  // Setup service worker in playwright
  const context = page.context();
  const serviceWorkerPromise = context.waitForEvent('serviceworker');
  await gotoPage(page, { port });
  await page.reload();
  await serviceWorkerPromise;
  await page.evaluate(async () => {
    const registration = await window.navigator.serviceWorker.getRegistration();
    if (registration?.active?.state === 'activated') {
      return;
    }
    await new Promise((res) =>
      window.navigator.serviceWorker.addEventListener('controllerchange', res),
    );
  });

  expect(await page.evaluate(() => window.swStatus)).toBe('ready');
};

test('should compile service worker in build', async ({ page, build }) => {
  const rsbuild = await build();
  const { port } = await rsbuild.instance.preview();
  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);
  expect(
    filenames.some((filename) => filename.endsWith('/sw.js')),
  ).toBeTruthy();
  await waitForServiceWorker(page, port);
});

test('should compile service worker in dev', async ({ devOnly, page }) => {
  const { port } = await devOnly();
  await waitForServiceWorker(page, port);
});
