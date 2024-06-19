import fs from 'node:fs';
import path from 'node:path';
import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { fse } from '@rsbuild/shared';

const packagePath = path.join(
  __dirname,
  'node_modules/@rsdoctor/rspack-plugin',
);
const testFile = path.join(packagePath, 'test.txt');

rspackOnlyTest(
  'should register Rsdoctor plugin when process.env.RSDOCTOR is true',
  async () => {
    fs.rmSync(packagePath, { recursive: true, force: true });
    fse.copySync(path.join(__dirname, 'mock'), packagePath);

    const { logs, restore } = proxyConsole();
    process.env.RSDOCTOR = 'true';

    await build({
      cwd: __dirname,
    });

    expect(fs.existsSync(testFile)).toBe(true);
    expect(
      logs.some((log) => log.includes('@rsdoctor') && log.includes('enabled')),
    ).toBe(true);

    process.env.RSDOCTOR = '';
    restore();
  },
);

rspackOnlyTest(
  'should not register Rsdoctor plugin when process.env.RSDOCTOR is false',
  async () => {
    fs.rmSync(packagePath, { recursive: true, force: true });
    fse.copySync(path.join(__dirname, 'mock'), packagePath);

    process.env.RSDOCTOR = 'false';

    await build({
      cwd: __dirname,
    });

    expect(fs.existsSync(testFile)).toBe(false);
    process.env.RSDOCTOR = '';
  },
);
