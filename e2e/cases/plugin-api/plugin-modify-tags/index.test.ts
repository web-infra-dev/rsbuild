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

  expect(
    files[indexHTML!].includes(
      '<script id="foo" src="https://example.com/foo.js"></script></head><body><div id="root"></div><script id="bar" src="https://example.com/bar.js"></script></body>',
    ),
  ).toBeTruthy();
});
