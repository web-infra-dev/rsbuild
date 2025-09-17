import { expect, test } from '@e2e/helper';

test('should compile CSS Modules global mode correctly', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toEqual(
    '.foo{position:relative}.foo .bar,.foo .baz{height:100%;overflow:hidden}.foo .lol{width:80%}',
  );
});
