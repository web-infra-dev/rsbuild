import { exec } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  expectFile,
  getRandomPort,
  gotoPage,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect, test } from '@playwright/test';
import fse from 'fs-extra';
import { tempConfig } from './rsbuild.config';

rspackOnlyTest(
  'should watch tsconfig.json and reload the server when it changes',
  async ({ page }) => {
    const dist = join(__dirname, 'dist');

    await fse.remove(dist);
    await fse.remove(tempConfig);
    await fse.copy(join(__dirname, 'tsconfig.json'), tempConfig);

    const port = await getRandomPort();
    const childProcess = exec('npx rsbuild dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(port),
      },
    });

    await expectFile(dist);
    await gotoPage(page, { port });
    await expect(page.locator('#content')).toHaveText('foo');

    const tsconfigContent = await readFile(tempConfig, 'utf-8');
    await writeFile(tempConfig, tsconfigContent.replace('foo', 'bar'));
    await expect(page.locator('#content')).toHaveText('bar');

    childProcess.kill();
  },
);
