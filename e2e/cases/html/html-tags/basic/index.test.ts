import { expect, test } from '@e2e/helper';

test('should inject tags correctly', async ({ build }) => {
  const rsbuild = await build();

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
