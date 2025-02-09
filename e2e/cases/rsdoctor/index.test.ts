import fs from 'node:fs';
import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should register Rsdoctor plugin when process.env.RSDOCTOR is true',
  async () => {
    const { logs, restore } = proxyConsole();
    process.env.RSDOCTOR = 'true';

    await build({
      cwd: __dirname,
    });

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
    const { logs, restore } = proxyConsole();
    process.env.RSDOCTOR = 'false';

    await build({
      cwd: __dirname,
    });

    expect(
      logs.some((log) => log.includes('@rsdoctor') && log.includes('enabled')),
    ).toBe(false);

    process.env.RSDOCTOR = '';
    restore();
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
