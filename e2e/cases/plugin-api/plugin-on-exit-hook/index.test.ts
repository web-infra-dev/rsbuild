import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { remove } from 'fs-extra';

const distFile = path.join(__dirname, 'node_modules/hooksTempFile');

rspackOnlyTest('should run onExit hook before process exit', async () => {
  await remove(distFile);

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      process.kill();
      reject(new Error('Process timeout'));
    }, 3000);

    const process = exec('node ./run.mjs', { cwd: __dirname }, (error) => {
      if (error) {
        clearTimeout(timeoutId);
        reject(error);
        return;
      }

      try {
        expect(fs.readFileSync(distFile, 'utf-8')).toEqual('0');
        clearTimeout(timeoutId);
        resolve();
      } catch (err) {
        clearTimeout(timeoutId);
        reject(err);
      }
    });
  });
});
