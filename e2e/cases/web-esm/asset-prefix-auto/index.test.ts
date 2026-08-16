import { expect, test } from '@e2e/helper';
import { findFile, getFileContent } from '@rstackjs/test-utils';

test('should resolve assets with auto asset prefix in web ESM bundles', async ({
  page,
  runBothServe,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await runBothServe(async ({ mode, result }) => {
    const html = getFileContent(result.getDistFiles(), 'index.html');
    expect(html).toMatch(/<script type="module" src="(?:\.\/)?static\/js\//);

    await page.locator('#load').click();

    await expect(page.locator('#async')).toHaveText('Auto asset prefix loaded!');
    await expect(page.locator('#async')).toHaveCSS('color', 'rgb(255, 0, 0)');

    const image = page.locator('#async-image');
    await expect(image).toHaveAttribute('src', /static\/image\//);
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);

    if (mode === 'build') {
      const files = result.getDistFiles();
      expect(findFile(files, 'static/js/async/asset-prefix-auto.js')).toBeTruthy();
      expect(findFile(files, 'static/css/async/asset-prefix-auto.css')).toBeTruthy();
      expect(findFile(files, 'static/image/image.png')).toBeTruthy();
    }
  });

  expect(pageErrors).toEqual([]);
});
