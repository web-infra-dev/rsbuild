import { expect, normalizeNewlines, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should not inject charset meta if template already contains it',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      rsbuildConfig: {
        html: {
          template: './src/index.html',
        },
        output: {
          filenameHash: false,
        },
      },
    });
    const files = rsbuild.getDistFiles();

    const html =
      files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
    expect(normalizeNewlines(html)).toEqual(`<!doctype html>
<html>
  <head>
    <title>Page Title</title>
    <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"><script defer src="/static/js/index.js"></script></head>
  <body>
    <div id="root"></div>
  </body>
</html>
`);
  },
);
