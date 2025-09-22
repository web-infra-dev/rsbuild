import { expect, test } from '@e2e/helper';
import type { Page } from 'playwright';

declare global {
  interface Window {
    swStatus: string;
  }
}

const waitForServiceWorker = async (page: Page) => {
  // Setup service worker in playwright
  const context = page.context();
  const serviceWorkerPromise = context.waitForEvent('serviceworker');
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

test('should compile service worker in build', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview();
  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);
  expect(
    filenames.some((filename) => filename.endsWith('dist/sw.js')),
  ).toBeTruthy();
  await waitForServiceWorker(page);
});

test('should compile service worker in dev', async ({ dev, page }) => {
  await dev();
  await waitForServiceWorker(page);
});
