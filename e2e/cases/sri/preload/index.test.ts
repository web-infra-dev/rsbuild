import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'generate integrity for preload tags in prod build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const files = await rsbuild.unwrapOutputJSON();
    const html =
      files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

    expect(html).toMatch(
      /<link href="\/static\/js\/async\/foo\.\w{8}\.js" rel="preload" as="script" integrity="sha384-[A-Za-z0-9+\/=]+"/,
    );

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('Hello Rsbuild!');
    await rsbuild.close();
  },
);
