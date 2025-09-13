import { expect, test } from '@e2e/helper';

test('should compile CSS Modules with :global() correctly', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toMatch(
    /.*\{position:relative\}.* \.bar,.* \.baz\{height:100%;overflow:hidden\}.* \.lol{width:80%}/,
  );
});
