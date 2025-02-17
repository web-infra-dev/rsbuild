import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should use custom config when using --config option',
  async () => {
    execSync('npx rsbuild build --config ./custom.config.mjs', {
      cwd: import.meta.dirname,
    });

    const outputs = await globContentJSON(
      path.join(import.meta.dirname, 'dist-custom'),
    );
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);

rspackOnlyTest(
  'should support custom config to find absolute path',
  async () => {
    const absPath = path.join(import.meta.dirname, 'custom.config.mjs');
    execSync(`npx rsbuild build --config ${absPath}`, {
      cwd: import.meta.dirname,
    });
    const outputs = await globContentJSON(
      path.join(import.meta.dirname, 'dist-custom'),
    );
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
