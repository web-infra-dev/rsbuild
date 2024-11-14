import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { awaitFileExists, rspackOnlyTest, webpackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import fse from 'fs-extra';

rspackOnlyTest('should support restart build when config changed', async () => {
  const indexFile = path.join(__dirname, 'src/index.js');
  const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
  fs.rmSync(indexFile, { force: true });
  fs.rmSync(distIndexFile, { force: true });
  const tempConfigFile = path.join(__dirname, 'test-temp-rsbuild.config.mjs');

  fse.outputFileSync(
    tempConfigFile,
    `export default {
  output: {
    filenameHash: false,
  },
};
`,
  );

  fse.outputFileSync(indexFile, `console.log('hello!');`);

  const process = exec(`npx rsbuild build --watch -c ${tempConfigFile}`, {
    cwd: __dirname,
  });

  await awaitFileExists(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello!');
  fs.rmSync(distIndexFile, { force: true });

  fse.outputFileSync(
    tempConfigFile,
    `export default {
  // update
  output: {
    filenameHash: false,
  },
};
`,
  );

  await awaitFileExists(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello!');
  fs.rmSync(distIndexFile, { force: true });

  fse.outputFileSync(indexFile, `console.log('hello2!');`);
  await awaitFileExists(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello2!');

  process.kill();
});

webpackOnlyTest(
  'should support restart webpack build when config changed',
  async () => {
    const indexFile = path.join(__dirname, 'src/index.js');
    const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
    fs.rmSync(indexFile, { force: true });
    fs.rmSync(distIndexFile, { force: true });
    const tempConfigFile = path.join(__dirname, 'test-temp-rsbuild.config.mjs');

    fse.outputFileSync(
      tempConfigFile,
      `import { defineConfig } from '@rsbuild/core';
import { pluginSwc } from '@rsbuild/plugin-webpack-swc';
import { webpackProvider } from '@rsbuild/webpack';

export default defineConfig({
  plugins: [pluginSwc()],
  provider: webpackProvider,
  output: {
    filenameHash: false,
  },
});
`,
    );

    fse.outputFileSync(indexFile, `console.log('hello!');`);

    const process = exec(`npx rsbuild build --watch -c ${tempConfigFile}`, {
      cwd: __dirname,
    });

    await awaitFileExists(distIndexFile);
    expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello!');
    fs.rmSync(distIndexFile, { force: true });

    fse.outputFileSync(
      tempConfigFile,
      `import { defineConfig } from '@rsbuild/core';
import { pluginSwc } from '@rsbuild/plugin-webpack-swc';
import { webpackProvider } from '@rsbuild/webpack';

export default defineConfig({
  plugins: [pluginSwc()],
  provider: webpackProvider,
  // update
  output: {
    filenameHash: false,
  },
});
`,
    );

    await awaitFileExists(distIndexFile);
    expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello!');
    fs.rmSync(distIndexFile, { force: true });

    fse.outputFileSync(indexFile, `console.log('hello2!');`);
    await awaitFileExists(distIndexFile);
    expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello2!');

    process.kill();
  },
);
