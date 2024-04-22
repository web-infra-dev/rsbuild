import { exec } from 'node:child_process';
import path from 'node:path';
import { awaitFileExists, getRandomPort } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

// Skipped as it occasionally failed in CI
test.skip('should restart dev server when .env file is changed', async () => {
  const dist = path.join(__dirname, 'dist');
  const configFile = path.join(__dirname, 'rsbuild.config.mjs');
  const envLocalFile = path.join(__dirname, '.env.local');
  const distIndex = path.join(dist, 'static/js/index.js');
  fse.removeSync(dist);
  fse.removeSync(configFile);
  fse.removeSync(envLocalFile);

  fse.writeFileSync(envLocalFile, 'PUBLIC_NAME=jack');
  fse.writeFileSync(
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

  await awaitFileExists(distIndex);
  expect(fse.readFileSync(distIndex, 'utf-8')).toContain('jack');

  fse.removeSync(distIndex);
  fse.writeFileSync(envLocalFile, 'PUBLIC_NAME=rose');
  await awaitFileExists(distIndex);
  expect(fse.readFileSync(distIndex, 'utf-8')).toContain('rose');

  devProcess.kill();
});
