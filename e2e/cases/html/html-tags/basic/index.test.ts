import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should inject tags correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(indexHtml.includes('<script src="/foo.js"></script>')).toBeTruthy();
  expect(
    indexHtml.includes('<script src="https://www.cdn.com/foo.js"></script>'),
  ).toBeTruthy();
  expect(
    indexHtml.includes('<meta name="referrer" content="origin">'),
  ).toBeTruthy();
  expect(
    indexHtml.includes('<link ref="preconnect" href="https://example.com">'),
  ).toBeTruthy();
});
