import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should resolve assets with auto asset prefix in web ESM bundles', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ result }) => {
    const html = getFileContent(result.getDistFiles(), 'index.html');
    expect(html).toMatch(/<script type="module" src="(?:\.\/)?static\/js\//);

    const content = page.locator('#async');
    await expect(content).toHaveText('Auto asset prefix loaded!');
    await expect(content).toHaveCSS('color', 'rgb(255, 0, 0)');

    const image = page.locator('#async-image');
    await expect(image).toHaveAttribute('src', /static\/image\//);
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);
  });
});
