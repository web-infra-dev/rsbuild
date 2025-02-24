import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { removeSync } from 'fs-extra';

const clean = () => {
  removeSync(path.join(__dirname, 'dist'));
  delete process.env.NODE_ENV;
};

rspackOnlyTest('should run inspect command correctly', async () => {
  clean();

  execSync('npx rsbuild inspect', {
    cwd: __dirname,
  });

  const files = await globContentJSON(path.join(__dirname, 'dist/.rsbuild'));
  const fileNames = Object.keys(files);

  const rsbuildConfig = fileNames.find((item) =>
    item.includes('rsbuild.config.mjs'),
  );
  expect(rsbuildConfig).toBeTruthy();
  expect(files[rsbuildConfig!]).toContain("'rsbuild:basic'");
  expect(files[rsbuildConfig!]).toContain('hmr: true');
  expect(files[rsbuildConfig!]).toContain('plugins:');

  const rspackConfig = fileNames.find((item) =>
    item.includes('rspack.config.web.mjs'),
  );
  expect(rspackConfig).toBeTruthy();
  expect(files[rspackConfig!]).toContain("mode: 'development'");
});

rspackOnlyTest(
  'should run inspect command with mode option correctly',
  async () => {
    clean();

    execSync('npx rsbuild inspect --mode production', {
      cwd: __dirname,
    });

    const files = await globContentJSON(path.join(__dirname, 'dist/.rsbuild'));
    const fileNames = Object.keys(files);

    const rsbuildConfig = fileNames.find((item) =>
      item.includes('rsbuild.config.mjs'),
    );
    expect(rsbuildConfig).toBeTruthy();

    const rspackConfig = fileNames.find((item) =>
      item.includes('rspack.config.web.mjs'),
    );
    expect(rspackConfig).toBeTruthy();
    expect(files[rspackConfig!]).toContain("mode: 'production'");
  },
);

rspackOnlyTest(
  'should run inspect command with output option correctly',
  async () => {
    clean();

    execSync('npx rsbuild inspect --output foo', {
      cwd: __dirname,
    });

    const outputs = await globContentJSON(path.join(__dirname, 'dist/foo'));
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.includes('rsbuild.config.mjs')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.includes('rspack.config.web.mjs')),
    ).toBeTruthy();
  },
);
