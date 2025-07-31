import { execSync } from 'node:child_process';
import path from 'node:path';
import { readDirContents, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should only build specified environment when using --environment option',
  async () => {
    execSync('npx rsbuild build --environment web2', {
      cwd: __dirname,
    });

    const files = await readDirContents(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(files);

    expect(
      outputFiles.find((item) => item.includes('web1/index.html')),
    ).toBeFalsy();
    expect(
      outputFiles.find((item) => item.includes('web2/index.html')),
    ).toBeTruthy();
  },
);

rspackOnlyTest(
  'should build specified environments when using --environment shorten option',
  async () => {
    execSync('npx rsbuild build --environment web1,web2', {
      cwd: __dirname,
    });

    const files = await readDirContents(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(files);

    expect(
      outputFiles.find((item) => item.includes('web1/index.html')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.includes('web2/index.html')),
    ).toBeTruthy();
  },
);
