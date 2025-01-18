import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should let lightningcss minimizer inherit from tools.lightningcssLoader',
  async ({ page }) => {
    const cssIndex = join(__dirname, 'dist/static/css/index.css');

    await dev({
      cwd: __dirname,
      page,
    });
    const devContent = await readFile(cssIndex, 'utf-8');
    expect(devContent).toContain('margin-inline-end: 100px;');

    await build({
      cwd: __dirname,
    });
    const buildContent = await readFile(cssIndex, 'utf-8');
    expect(buildContent).toContain('margin-inline-end:100px');
  },
);
