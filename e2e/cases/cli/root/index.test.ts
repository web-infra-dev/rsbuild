import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should run build command with --root option correctly',
  async () => {
    execSync('npx rsbuild build --root test', {
      cwd: import.meta.dirname,
    });

    const outputs = await globContentJSON(
      path.join(import.meta.dirname, 'test', 'dist'),
    );
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
  },
);

rspackOnlyTest(
  'should run build command with -r option correctly',
  async () => {
    execSync('npx rsbuild build -r test', {
      cwd: import.meta.dirname,
    });

    const outputs = await globContentJSON(
      path.join(import.meta.dirname, 'test', 'dist'),
    );
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
  },
);
