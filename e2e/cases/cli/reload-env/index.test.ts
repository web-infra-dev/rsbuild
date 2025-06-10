import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expectFile, getRandomPort, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { remove } from 'fs-extra';

rspackOnlyTest(
  'should restart dev server when .env file is changed',
  async () => {
    const dist = path.join(__dirname, 'dist');
    const configFile = path.join(__dirname, 'rsbuild.config.mjs');
    const envLocalFile = path.join(__dirname, '.env.local');
    const distIndex = path.join(dist, 'static/js/index.js');

    await remove(dist);
    await remove(configFile);
    await remove(envLocalFile);

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

    const devProcess = exec('npx rsbuild dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });

    await expectFile(distIndex);
    expect(fs.readFileSync(distIndex, 'utf-8')).toContain('jack');

    await remove(distIndex);

    fs.writeFileSync(envLocalFile, 'PUBLIC_NAME=rose');
    await expectFile(distIndex);
    expect(fs.readFileSync(distIndex, 'utf-8')).toContain('rose');

    devProcess.kill();
  },
);
