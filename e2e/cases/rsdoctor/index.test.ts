import fs from 'node:fs';
import path from 'node:path';
import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const packagePath = path.join(
  __dirname,
  'node_modules/@rsdoctor/rspack-plugin',
);
const testFile = path.join(packagePath, 'test-temp.txt');

test.beforeEach(() => {
  fs.rmSync(packagePath, { recursive: true, force: true });
  fs.cpSync(path.join(__dirname, 'mock'), packagePath, { recursive: true });
});

rspackOnlyTest(
  'should register Rsdoctor plugin when process.env.RSDOCTOR is true',
  async () => {
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
    process.env.RSDOCTOR = 'false';

    await build({
      cwd: __dirname,
    });

    expect(fs.existsSync(testFile)).toBe(false);
    process.env.RSDOCTOR = '';
  },
);

rspackOnlyTest(
  'should not register Rsdoctor plugin when process.env.RSDOCTOR is true and the plugin has been registered',
  async () => {
    const { logs, restore } = proxyConsole();
    const { RsdoctorRspackPlugin } = require('@rsdoctor/rspack-plugin');

    process.env.RSDOCTOR = 'true';

    await build({
      cwd: __dirname,
      rsbuildConfig: {
        tools: {
          rspack: {
            plugins: [new RsdoctorRspackPlugin()],
          },
        },
      },
    });

    expect(
      logs.some((log) => log.includes('@rsdoctor') && log.includes('enabled')),
    ).toBe(false);

    process.env.RSDOCTOR = '';
    restore();
  },
);
