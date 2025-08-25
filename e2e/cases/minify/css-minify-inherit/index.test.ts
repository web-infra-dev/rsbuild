import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should let lightningcss minimizer inherit from tools.lightningcssLoader',
  async ({ page }) => {
    const cssBuildIndex = join(__dirname, 'dist/static/css/index.css');
    const cssDevIndex = join(
      __dirname,
      'dist/static/css/async/src_index_js.css',
    );

    await dev({
      cwd: __dirname,
      page,
    });
    await page.waitForRequest(/\.css/, { timeout: 1000 });
    const devContent = await readFile(cssDevIndex, 'utf-8');
    expect(devContent).toContain('margin-inline-end: 100px;');

    await build({
      cwd: __dirname,
    });
    const buildContent = await readFile(cssBuildIndex, 'utf-8');
    expect(buildContent).toContain('margin-inline-end:100px');
  },
);
