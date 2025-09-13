import { expect, rspackTest } from '@e2e/helper';

rspackTest('should allow plugin to process assets', async ({ build }) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js'),
  );
  const indexCss = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.css'),
  );

  expect(indexJs).toBeTruthy();
  expect(indexCss).toBeFalsy();
});
