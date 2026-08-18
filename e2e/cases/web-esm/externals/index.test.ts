import { expect, test } from '@e2e/helper';

test('should resolve externals with an import map in web ESM bundles', async ({
  page,
  runBothServe,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await runBothServe(async () => {
    await expect(page.locator('#root')).toHaveText('External module loaded!');

    const importMap = await page
      .locator('script[type="importmap"]')
      .textContent();
    expect(JSON.parse(importMap!)).toEqual({
      imports: {
        'external-module': '/external.js',
      },
    });
  });

  expect(pageErrors).toEqual([]);
});
