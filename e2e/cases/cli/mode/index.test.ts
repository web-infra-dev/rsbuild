import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should run build command with --mode option correctly',
  async () => {
    execSync('npx rsbuild build --mode development', {
      cwd: __dirname,
    });

    const outputs = await globContentJSON(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(outputs);

    // no filename hash in development mode
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js.map')),
    ).toBeTruthy();
  },
);

rspackOnlyTest(
  'should run build command with -m option correctly',
  async () => {
    execSync('npx rsbuild build -m development', {
      cwd: __dirname,
    });

    const outputs = await globContentJSON(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(outputs);

    // no filename hash in development mode
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js.map')),
    ).toBeTruthy();
  },
);
