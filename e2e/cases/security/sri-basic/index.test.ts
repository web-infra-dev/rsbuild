import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should generate integrity attributes for script and style tags in build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const files = rsbuild.getDistFiles();
    const html =
      files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

    expect(html).toMatch(
      /<script defer src="\/static\/js\/index\.\w{8}\.js" integrity="sha384-[A-Za-z0-9+/=]+"/,
    );

    expect(html).toMatch(
      /link href="\/static\/css\/index\.\w{8}\.css" rel="stylesheet" integrity="sha384-[A-Za-z0-9+/=]+"/,
    );

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('Hello Rsbuild!');
    await rsbuild.close();
  },
);

test('should not generate integrity attributes for script and style tags in dev', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  const testEl = page.locator('#root');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  expect(
    await page.evaluate(
      'document.querySelector("script")?.getAttribute("integrity")',
    ),
  ).toEqual(null);

  await rsbuild.close();
});
