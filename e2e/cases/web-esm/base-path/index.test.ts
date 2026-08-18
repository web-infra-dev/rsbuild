import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should load web ESM bundles under a base path', async ({
  page,
  runBothServe,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await runBothServe(async ({ result }) => {
    expect(new URL(page.url()).pathname).toContain('/base/');

    const html = getFileContent(result.getDistFiles(), 'index.html');
    expect(html).toMatch(/<script type="module" src="\/base\/static\/js\//);

    await page.locator('#load').click();
    await expect(page.locator('#async')).toHaveText('Base path loaded!');
    await expect(page.locator('#async')).toHaveCSS('color', 'rgb(255, 0, 0)');

    const image = page.locator('#async-image');
    await expect(image).toHaveAttribute('src', /\/base\/static\/image\//);
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  });

  expect(pageErrors).toEqual([]);
});
