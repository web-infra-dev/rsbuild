import { expect, test } from '@e2e/helper';
import { findFile } from '@rstackjs/test-utils';

test('should load async JS, CSS, and assets in web ESM bundles', async ({ page, runBothServe }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await runBothServe(async ({ mode, result }) => {
    await expect(page.locator('#async')).toHaveCount(0);
    await page.locator('#load').click();

    await expect(page.locator('#async')).toHaveText('Async chunk loaded!');
    await expect(page.locator('#async')).toHaveCSS('color', 'rgb(255, 0, 0)');

    const image = page.locator('#async-image');
    await expect(image).toHaveAttribute('src', /\/static\/image\//);
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);

    if (mode === 'build') {
      const files = result.getDistFiles();
      expect(findFile(files, 'static/js/async/async.js')).toBeTruthy();
      expect(findFile(files, 'static/css/async/async.css')).toBeTruthy();
      expect(findFile(files, 'static/image/image.png')).toBeTruthy();
    }
  });

  expect(pageErrors).toEqual([]);
});
