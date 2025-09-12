import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should generate tailwindcss utilities with vendor prefixes correctly',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const files = rsbuild.getDistFiles();
    const indexCssFile = Object.keys(files).find(
      (file) => file.includes('index.') && file.endsWith('.css'),
    )!;

    expect(files[indexCssFile]).toContain('-webkit-user-select: none;');
    expect(files[indexCssFile]).toContain('-ms-user-select: none;');
    expect(files[indexCssFile]).toContain('user-select: none;');
  },
);
