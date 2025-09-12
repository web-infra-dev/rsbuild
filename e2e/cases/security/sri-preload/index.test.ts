import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'generate integrity for preload tags in build',
  async ({ page, build }) => {
    const rsbuild = await build();

    const files = rsbuild.getDistFiles();
    const html =
      files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

    expect(html).toMatch(
      /<link href="\/static\/js\/async\/foo\.\w{8}\.js" rel="preload" as="script" integrity="sha384-[A-Za-z0-9+/=]+"/,
    );

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('Hello Rsbuild!');
  },
);
