import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should render an SVG React component via SVGR (named export)', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
