import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should load postcss.config.ts correctly',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();

    const files = rsbuild.getDistFiles();
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
  },
);
