import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest(
  'generate integrity for preload tags in build',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview();

    const files = rsbuild.getDistFiles();
    const html = getFileContent(files, 'index.html');

    expect(html).toMatch(
      /<link href="\/static\/js\/async\/foo\.\w{8}\.js" rel="preload" as="script" integrity="sha384-[A-Za-z0-9+/=]+"/,
    );

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('Hello Rsbuild!');
  },
);
