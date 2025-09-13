import { expect, test } from '@e2e/helper';

test('should generate preconnect link when preconnect is defined', async ({
  build,
}) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  expect(
    content.includes('<link rel="preconnect" href="http://aaaa.com">'),
  ).toBeTruthy();

  expect(
    content.includes(
      '<link rel="preconnect" href="http://bbbb.com" crossorigin>',
    ),
  ).toBeTruthy();
});
