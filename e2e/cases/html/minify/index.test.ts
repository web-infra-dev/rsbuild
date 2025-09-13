import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should minify template success when inlineScripts & inlineStyles',
  async ({ buildPreview }) => {
    const rsbuild = await buildPreview({
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
