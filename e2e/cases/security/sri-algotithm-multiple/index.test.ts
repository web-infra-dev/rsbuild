import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest(
  'generate integrity using multiple algorithms',
  async ({ page, buildPreview }) => {
    const rsbuild = await buildPreview();

    const files = rsbuild.getDistFiles();
    const html = getFileContent(files, 'index.html');

    expect(html).toMatch(
      /<script defer src="\/static\/js\/index\.\w{8}\.js" integrity="sha512-[A-Za-z0-9+/=]+ sha256-[A-Za-z0-9+/=]+ sha384-[A-Za-z0-9+/=]+"/,
    );

    expect(html).toMatch(
      /link href="\/static\/css\/index\.\w{8}\.css" rel="stylesheet" integrity="sha512-[A-Za-z0-9+/=]+ sha256-[A-Za-z0-9+/=]+ sha384-[A-Za-z0-9+/=]+"/,
    );

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('Hello Rsbuild!');
  },
);
