import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { awaitFileExists, getRandomPort } from '@e2e/helper';
import { test } from '@playwright/test';

test('should restart dev server and reload config when config file changed', async () => {
  const dist1 = path.join(__dirname, 'dist');
  const dist2 = path.join(__dirname, 'dist-2');
  const configFile = path.join(__dirname, 'rsbuild.config.mjs');

  fs.rmSync(dist1, { force: true, recursive: true });
  fs.rmSync(dist2, { force: true, recursive: true });
  fs.rmSync(configFile, { force: true });

  fs.writeFileSync(
    configFile,
    `export default {
      dev: {
        writeToDisk: true,
      },
      output: {
        distPath: {
          root: 'dist',
        },
      },
      server: { port: ${await getRandomPort()} }
    };`,
  );

  const process = exec('npx rsbuild dev', {
    cwd: __dirname,
  });

  await awaitFileExists(dist1);

  fs.writeFileSync(
    configFile,
    `export default {
      dev: {
        writeToDisk: true,
      },
      output: {
        distPath: {
          root: 'dist-2',
        },
      },
      server: { port: ${await getRandomPort()} }
    };`,
  );

  await awaitFileExists(dist2);

  process.kill();
});
