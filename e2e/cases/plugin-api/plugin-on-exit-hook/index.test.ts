import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

const distFile = path.join(__dirname, 'node_modules/hooksTempFile');

rspackOnlyTest('should run onExit hook before process exit', async () => {
  fs.rmSync(distFile, { force: true });

  await new Promise<void>((resolve) => {
    const process = exec('node ./run.mjs', { cwd: __dirname }, () => {
      expect(fs.readFileSync(distFile, 'utf-8')).toEqual('1');
      resolve();
      process.kill();
    });
  });
});
