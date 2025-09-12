import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'generate integrity using sha512 algorithm',
  async ({ page, build }) => {
    const rsbuild = await build();

    const files = rsbuild.getDistFiles();
    const html =
      files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

    expect(html).toMatch(
      /<script defer src="\/static\/js\/index\.\w{8}\.js" integrity="sha512-[A-Za-z0-9+/=]+"/,
    );

    expect(html).toMatch(
      /link href="\/static\/css\/index\.\w{8}\.css" rel="stylesheet" integrity="sha512-[A-Za-z0-9+/=]+"/,
    );

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('Hello Rsbuild!');
  },
);
