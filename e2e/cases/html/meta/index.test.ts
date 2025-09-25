import {
  expect,
  getFileContent,
  normalizeNewlines,
  rspackTest,
} from '@e2e/helper';

rspackTest(
  'should not inject charset meta if template already contains it',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const html = getFileContent(files, 'index.html');
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
