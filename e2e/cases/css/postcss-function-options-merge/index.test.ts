import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should merge `postcssOptions` function with `postcss.config.ts` as expected', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const fooCssFile = Object.keys(files).find(
    (file) => file.includes('foo.') && file.endsWith('.css'),
  )!;
  expect(files[fooCssFile]).toEqual(
    '.font-bold{font-weight:700}.underline{text-decoration-line:underline}',
  );

  const barCssFile = Object.keys(files).find(
    (file) => file.includes('bar.') && file.endsWith('.css'),
  )!;
  expect(files[barCssFile]).toEqual(
    '.text-3xl{font-size:1.875rem;line-height:2.25rem}',
  );
});
