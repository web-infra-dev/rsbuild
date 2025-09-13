import { expect, rspackTest } from '@e2e/helper';

rspackTest('should allow to minify JS in dev', async ({ dev }) => {
  const rsbuild = await dev({
    rsbuildConfig: {
      output: {
        minify: {
          js: 'always',
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  expect(content).toContain('function(){console.log("main")}');
});
