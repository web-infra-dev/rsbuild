import { expect, getFileContent, test } from '@e2e/helper';

test('should generate tailwindcss utilities with mjs config correctly', async ({
  build,
}) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
  const indexCssContent = getFileContent(files, 'index.css');
  expect(indexCssContent).toContain(
    '.text-3xl{font-size:var(--text-3xl);line-height:var(--tw-leading,var(--text-3xl--line-height))}',
  );
  expect(indexCssContent).toContain(
    '.font-bold{--tw-font-weight:var(--font-weight-bold);font-weight:var(--font-weight-bold)}',
  );
  expect(indexCssContent).toContain(
    '.underline{text-decoration-line:underline}',
  );
});
