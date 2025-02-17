import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should let lightningcss minimizer inherit from tools.lightningcssLoader',
  async ({ page }) => {
    const cssIndex = join(import.meta.dirname, 'dist/static/css/index.css');

    await dev({
      cwd: import.meta.dirname,
      page,
    });
    const devContent = await readFile(cssIndex, 'utf-8');
    expect(devContent).toContain('margin-inline-end: 100px;');

    await build({
      cwd: import.meta.dirname,
    });
    const buildContent = await readFile(cssIndex, 'utf-8');
    expect(buildContent).toContain('margin-inline-end:100px');
  },
);
