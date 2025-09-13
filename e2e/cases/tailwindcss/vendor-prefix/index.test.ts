import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should generate tailwindcss utilities with vendor prefixes correctly',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();
    const indexCssFile = Object.keys(files).find(
      (file) => file.includes('index.') && file.endsWith('.css'),
    )!;

    expect(files[indexCssFile]).toContain('-webkit-user-select: none;');
    expect(files[indexCssFile]).toContain('-ms-user-select: none;');
    expect(files[indexCssFile]).toContain('user-select: none;');
  },
);
