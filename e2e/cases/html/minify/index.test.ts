import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should minify template success when inlineScripts & inlineStyles',
  async ({ build }) => {
    const rsbuild = await build({
      rsbuildConfig: {
        html: {
          template: './static/index.html',
          // avoid Minified React error #200;
          inject: 'body',
        },
        output: {
          inlineScripts: true,
          inlineStyles: true,
        },
      },
    });

    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.html'))!];

    expect(content.includes('html,body{margin:0;padding:0}')).toBeTruthy();
    expect(
      /let \w+=document\.createElement\("div"\)/.test(content),
    ).toBeTruthy();
  },
);
