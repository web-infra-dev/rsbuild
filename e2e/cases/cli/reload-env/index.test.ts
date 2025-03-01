import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expectFile, getRandomPort } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// Skipped as it occasionally failed in CI
test.skip('should restart dev server when .env file is changed', async () => {
  const dist = path.join(__dirname, 'dist');
  const configFile = path.join(__dirname, 'rsbuild.config.mjs');
  const envLocalFile = path.join(__dirname, '.env.local');
  const distIndex = path.join(dist, 'static/js/index.js');

  fs.rmSync(dist, { recursive: true, force: true });
  fs.rmSync(configFile, { force: true });
  fs.rmSync(envLocalFile, { force: true });

  fs.writeFileSync(envLocalFile, 'PUBLIC_NAME=jack');
  fs.writeFileSync(
    configFile,
    `export default {
      dev: {
        writeToDisk: true,
      },
      output: {
        filenameHash: false,
      },
      server: { port: ${await getRandomPort()} }
    };`,
  );

  delete process.env.NODE_ENV;
  const devProcess = exec('npx rsbuild dev', {
    cwd: __dirname,
  });

  await expectFile(distIndex);
  expect(fs.readFileSync(distIndex, 'utf-8')).toContain('jack');

  fs.rmSync(distIndex, { force: true });

  fs.writeFileSync(envLocalFile, 'PUBLIC_NAME=rose');
  await expectFile(distIndex);
  expect(fs.readFileSync(distIndex, 'utf-8')).toContain('rose');

  devProcess.kill();
});
