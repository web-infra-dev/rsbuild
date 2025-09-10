import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should exclude matched SVG files from SVGR processing (importer)', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(
    page.evaluate(`document.getElementById('foo').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  await expect(
    page.evaluate(
      `document.getElementById('bar').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
