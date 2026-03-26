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
}) => {
  const rsbuild = await build();

  const files = await getDistFiles(rsbuild.distPath);
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );

  await rsbuild.expectLog('Webpack Bundle Analyzer saved report to');
  expect(filePaths.length).toBe(1);
});

test('should surface stats file write errors when statsFilename points to a directory', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      performance: {
        bundleAnalyze: {
          generateStatsFile: true,
          statsFilename: '.',
        },
      },
    },
  });

  await rsbuild.expectLog('Webpack Bundle Analyzer error saving stats file to');
  await rsbuild.expectLog('EISDIR');
  expect(rsbuild.buildError).toBeFalsy();
});
