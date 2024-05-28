import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile CSS Modules global mode correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        cssModules: {
          mode: 'global',
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toEqual(
    '.foo{position:relative}.foo .bar,.foo .baz{height:100%;overflow:hidden}.foo .lol{width:80%}',
  );
});
