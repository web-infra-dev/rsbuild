import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should import svg with SVGR plugin and query URL correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/svg/mobile.svg'),
    ),
  ).toBeFalsy();
});
