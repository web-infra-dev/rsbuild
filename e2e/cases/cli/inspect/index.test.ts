import path from 'node:path';
import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { globContentJSON } from '@e2e/helper';

test('should run inspect command correctly', async () => {
  delete process.env.NODE_ENV;
  execSync('npx rsbuild inspect', {
    cwd: __dirname,
  });

  const files = await globContentJSON(path.join(__dirname, 'dist'));
  const fileNames = Object.keys(files);

  const rsbuildConfig = fileNames.find((item) =>
    item.includes('rsbuild.config.mjs'),
  );
  expect(rsbuildConfig).toBeTruthy();
  expect(files[rsbuildConfig!]).toContain("'rsbuild:basic'");
  expect(files[rsbuildConfig!]).toContain('hmr: true');

  const rspackConfig = fileNames.find((item) =>
    item.includes('rspack.config.web.mjs'),
  );
  expect(rspackConfig).toBeTruthy();
  expect(files[rspackConfig!]).toContain("mode: 'development'");
});

test('should run inspect command with output option correctly', async () => {
  delete process.env.NODE_ENV;
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
});
