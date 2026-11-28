import { expect, test } from '@e2e/helper';
import { findFiles, getFileContent } from '@rstackjs/test-utils';

test.for([false, true])(
  'should build a CSS entry with css=%s',
  async (css, { buildPreview, page }) => {
    const rsbuild = await buildPreview({ config: { css } });

    const files = rsbuild.getDistFiles();
    expect(findFiles(files, '.css')).toHaveLength(1);
    expect(findFiles(files, '.js')).toHaveLength(css ? 0 : 1);
    expect(getFileContent(files, 'index.css')).toBe(
      'body{color:red;background-color:#00f}',
    );
    expect(getFileContent(files, 'index.html')).toContain(
      'href="/static/css/index.css"',
    );
    await expect(page.locator('body')).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(0, 0, 255)',
    );
  },
);

test.for([
  { css: true, native: undefined, legacy: false },
  { css: undefined, native: true, legacy: undefined },
])(
  'should respect environment CSS options with root css=$css',
  async ({ css, native, legacy }, { build }) => {
    const rsbuild = await build({
      config: {
        css,
        environments: {
          native: { css: native, output: { distPath: 'dist/native' } },
          legacy: { css: legacy, output: { distPath: 'dist/legacy' } },
        },
      },
    });

    const files = rsbuild.getDistFiles();
    expect(findFiles(files, '.css')).toHaveLength(2);
    expect(findFiles(files, '.js')).toEqual([
      expect.stringContaining('/dist/legacy/static/js/index.js'),
    ]);
  },
);
