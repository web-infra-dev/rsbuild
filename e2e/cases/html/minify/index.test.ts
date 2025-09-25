import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest(
  'should minify template success when inlineScripts & inlineStyles',
  async ({ buildPreview }) => {
    const rsbuild = await buildPreview();

    const files = rsbuild.getDistFiles();

    const content = getFileContent(files, '.html');

    expect(content.includes('html,body{margin:0;padding:0}')).toBeTruthy();
    expect(
      /let \w+=document\.createElement\("div"\)/.test(content),
    ).toBeTruthy();
  },
);
