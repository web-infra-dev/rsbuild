import { join } from 'node:path';
import { build, dev, proxyConsole, readDirContents } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should emit bundle analyze report correctly when dev', async ({
  page,
}) => {
  const { logs, restore } = proxyConsole();

  const rsbuild = await dev({
    cwd: __dirname,
  });

  await page.goto(`http://localhost:${rsbuild.port}`);
  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  const files = await readDirContents(join(__dirname, 'dist'));
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );
  expect(filePaths.length).toBe(1);

  expect(
    logs.some((log) => log.includes('Webpack Bundle Analyzer saved report to')),
  ).toBeTruthy();

  await rsbuild.close();

  restore();
});

test('should emit bundle analyze report correctly when build', async () => {
  const { logs, restore } = proxyConsole();

  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );

  expect(
    logs.some((log) => log.includes('Webpack Bundle Analyzer saved report to')),
  ).toBeTruthy();

  expect(filePaths.length).toBe(1);

  restore();
});
