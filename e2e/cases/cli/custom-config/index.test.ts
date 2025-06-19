import { execSync } from 'node:child_process';
import path from 'node:path';
import { readDirContents, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should use custom config when using --config option',
  async () => {
    execSync('npx rsbuild build --config ./custom.config.mjs', {
      cwd: __dirname,
    });

    const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);

rspackOnlyTest(
  'should support custom config to find absolute path',
  async () => {
    const absPath = path.join(__dirname, 'custom.config.mjs');
    execSync(`npx rsbuild build --config ${absPath}`, {
      cwd: __dirname,
    });
    const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
