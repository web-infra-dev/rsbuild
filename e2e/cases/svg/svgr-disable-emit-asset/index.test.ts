import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test('should import svg with SVGR plugin and query URL correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/svg/mobile.svg'),
    ),
  ).toBeFalsy();
});
