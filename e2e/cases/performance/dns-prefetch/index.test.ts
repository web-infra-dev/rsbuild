import { expect, test } from '@e2e/helper';

test('should generate dnsPrefetch link when dnsPrefetch is defined', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly();

  const files = rsbuild.getDistFiles();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  expect(
    content.includes('<link rel="dns-prefetch" href="http://aaaa.com">'),
  ).toBeTruthy();
});
