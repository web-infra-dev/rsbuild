import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should generate tailwindcss utilities with vendor prefixes correctly',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    const files = rsbuild.getDistFiles();
    const indexCssFile = Object.keys(files).find(
      (file) => file.includes('index.') && file.endsWith('.css'),
    )!;

    expect(files[indexCssFile]).toContain('-webkit-user-select: none;');
    expect(files[indexCssFile]).toContain('-ms-user-select: none;');
    expect(files[indexCssFile]).toContain('user-select: none;');
  },
);
