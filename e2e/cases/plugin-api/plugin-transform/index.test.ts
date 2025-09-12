import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow plugin to transform code', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js'),
  );
  const indexCss = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.css'),
  );
  const helloTxt = Object.keys(files).find((file) =>
    file.includes('hello.txt'),
  );

  expect(files[indexJs!].includes('world')).toBeTruthy();
  expect(files[indexCss!].includes('#00f')).toBeTruthy();
  expect(files[helloTxt!].includes('hello world')).toBeTruthy();
});
