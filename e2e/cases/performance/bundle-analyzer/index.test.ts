import { expect, getDistFiles, test } from '@e2e/helper';

test('should emit bundle analyze report correctly when dev', async ({
  page,
  devOnly,
}) => {
  const rsbuild = await devOnly();

  await page.goto(`http://localhost:${rsbuild.port}`);
  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  const files = await getDistFiles(rsbuild.distPath);
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );
  expect(filePaths.length).toBe(1);

  await rsbuild.expectLog('Webpack Bundle Analyzer saved report to');
});

test('should emit bundle analyze report correctly when build', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly();

  const files = await getDistFiles(rsbuild.distPath);
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );

  await rsbuild.expectLog('Webpack Bundle Analyzer saved report to');
  expect(filePaths.length).toBe(1);
});
