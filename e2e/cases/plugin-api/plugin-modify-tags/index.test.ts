import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow plugin to modify HTML tags', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const indexHTML = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.html'),
  );

  const html = files[indexHTML!];

  expect(
    html.includes(
      '<script defer="defer" src="https://example.com/static/js/index.js"></script><link href="https://example.com/static/css/index.css" rel="stylesheet"><script id="foo" src="https://example.com/foo.js"></script></head>',
    ),
  ).toBeTruthy();
  expect(
    html.includes(
      '<body><div id="root"></div><script id="bar" src="https://cdn.com/bar.js"></script><div>index.html</div><div>assets: 2</div>',
    ),
  ).toBeTruthy();
});
