import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { readDirContents, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { remove } from 'fs-extra';

const distPath = join(__dirname, 'dist');

test.beforeEach(async () => {
  await remove(distPath);
});

rspackOnlyTest(
  'should only build specified environment when using --environment option',
  async () => {
    execSync('npx rsbuild build --environment web2', {
      cwd: __dirname,
    });

    const files = await readDirContents(distPath);
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

    const files = await readDirContents(distPath);
    const outputFiles = Object.keys(files);

    expect(
      outputFiles.find((item) => item.includes('web1/index.html')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.includes('web2/index.html')),
    ).toBeTruthy();
  },
);
