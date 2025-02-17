import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should generate tailwindcss utilities correctly', async () => {
  const rsbuild = await build({
    cwd: import.meta.dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const indexCssFile = Object.keys(files).find(
    (file) => file.includes('index.') && file.endsWith('.css'),
  )!;

  const indexCssContent = files[indexCssFile];
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
