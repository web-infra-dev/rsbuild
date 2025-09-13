import { expect, rspackTest } from '@e2e/helper';

rspackTest('should compile common CSS import correctly', async ({ build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      resolve: {
        alias: {
          '@': './src',
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual(
    'html{min-height:100%}#a{color:red}#b{color:#00f}',
  );
});
