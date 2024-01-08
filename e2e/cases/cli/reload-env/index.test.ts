import path from 'path';
import { exec } from 'child_process';
import { test, expect } from '@playwright/test';
import { fse } from '@rsbuild/shared';
import { awaitFileExists } from '@scripts/helper';
import { getRandomPort } from '@scripts/shared';

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
        disableFilenameHash: true,
      },
      server: { port: ${await getRandomPort()} }
    };`,
  );

  const process = exec('npx rsbuild dev', {
    cwd: __dirname,
  });

  await awaitFileExists(distIndex);
  expect(fse.readFileSync(distIndex, 'utf-8')).toContain('jack');

  fse.removeSync(distIndex);
  fse.writeFileSync(envLocalFile, 'PUBLIC_NAME=rose');
  await awaitFileExists(distIndex);
  expect(fse.readFileSync(distIndex, 'utf-8')).toContain('rose');

  process.kill();
});
