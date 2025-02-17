import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should set NODE_ENV correctly when running build command',
  async () => {
    delete process.env.NODE_ENV;
    execSync('npx rsbuild build', {
      cwd: import.meta.dirname,
    });

    const outputs = await globContentJSON(
      path.join(import.meta.dirname, 'dist-prod'),
    );
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
