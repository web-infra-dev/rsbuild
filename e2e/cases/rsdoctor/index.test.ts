import fs from 'node:fs';
import path from 'node:path';
import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
// @ts-expect-error
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

const packagePath = path.join(
  __dirname,
  'node_modules/@rsdoctor/rspack-plugin',
);
const testFile = path.join(packagePath, 'test-temp.txt');

rspackOnlyTest(
  'should register Rsdoctor plugin when process.env.RSDOCTOR is true',
  async () => {
    fs.rmSync(packagePath, { recursive: true, force: true });
    fs.cpSync(path.join(__dirname, 'mock'), packagePath, { recursive: true });

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
    fs.cpSync(path.join(__dirname, 'mock'), packagePath, { recursive: true });

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
    fs.rmSync(packagePath, { recursive: true, force: true });
    fs.cpSync(path.join(__dirname, 'mock'), packagePath, { recursive: true });

    const { logs, restore } = proxyConsole();
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
