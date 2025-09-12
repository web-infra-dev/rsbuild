import { expect, test } from '@e2e/helper';

test('should allow to use `postcssOptions` function to apply different postcss config for different files', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly();

  const fooCssExpected =
    '.font-bold{--tw-font-weight:var(--font-weight-bold);font-weight:var(--font-weight-bold)}.underline{text-decoration-line:underline}}';
  const barCssExpected =
    '.text-3xl{font-size:var(--text-3xl);line-height:var(--tw-leading,var(--text-3xl--line-height))}}';

  const files = rsbuild.getDistFiles();
  const fooCssFile = Object.keys(files).find(
    (file) => file.includes('foo.') && file.endsWith('.css'),
  )!;
  expect(files[fooCssFile]).toContain(fooCssExpected);
  expect(files[fooCssFile]).not.toContain(barCssExpected);

  const barCssFile = Object.keys(files).find(
    (file) => file.includes('bar.') && file.endsWith('.css'),
  )!;
  expect(files[barCssFile]).toContain(barCssExpected);
  expect(files[barCssFile]).not.toContain(fooCssExpected);
});
