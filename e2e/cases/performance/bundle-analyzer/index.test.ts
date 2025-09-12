import { build, dev, getDistFiles } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should emit bundle analyze report correctly when dev', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await page.goto(`http://localhost:${rsbuild.port}`);
  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  const files = await getDistFiles(rsbuild.distPath);
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );
  expect(filePaths.length).toBe(1);

  await rsbuild.expectLog('Webpack Bundle Analyzer saved report to');
  await rsbuild.close();
});

test('should emit bundle analyze report correctly when build', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await getDistFiles(rsbuild.distPath);
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );

  await rsbuild.expectLog('Webpack Bundle Analyzer saved report to');
  expect(filePaths.length).toBe(1);
  await rsbuild.close();
});
