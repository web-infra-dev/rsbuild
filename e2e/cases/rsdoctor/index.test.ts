import { proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { type Rspack, createRsbuild } from '@rsbuild/core';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { matchPlugin } from '@scripts/test-helper';

rspackOnlyTest(
  'should register Rsdoctor plugin when process.env.RSDOCTOR is true',
  async () => {
    // https://github.com/microsoft/playwright/issues/31140
    if (process.platform === 'win32') {
      test.skip();
    }

    const { logs, restore } = proxyConsole();
    process.env.RSDOCTOR = 'true';

    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });

    const compiler = await rsbuild.createCompiler();

    expect(
      logs.some((log) => log.includes('@rsdoctor') && log.includes('enabled')),
    ).toBe(true);

    expect(
      matchPlugin(
        compiler.options as Rspack.Configuration,
        'RsdoctorRspackPlugin',
      ),
    ).toBeTruthy();

    restore();
    process.env.RSDOCTOR = '';
  },
);

rspackOnlyTest(
  'should not register Rsdoctor plugin when process.env.RSDOCTOR is false',
  async () => {
    const { logs, restore } = proxyConsole();
    process.env.RSDOCTOR = 'false';

    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });

    const compiler = await rsbuild.createCompiler();

    expect(
      logs.some((log) => log.includes('@rsdoctor') && log.includes('enabled')),
    ).toBe(false);

    expect(
      matchPlugin(
        compiler.options as Rspack.Configuration,
        'RsdoctorRspackPlugin',
      ),
    ).toBeFalsy();

    process.env.RSDOCTOR = '';
    restore();
  },
);

rspackOnlyTest(
  'should not register Rsdoctor plugin when process.env.RSDOCTOR is true and the plugin has been registered',
  async () => {
    const { logs, restore } = proxyConsole();

    process.env.RSDOCTOR = 'true';

    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        tools: {
          rspack: {
            plugins: [
              new RsdoctorRspackPlugin({
                disableClientServer: true,
              }),
            ],
          },
        },
      },
    });

    const compiler = await rsbuild.createCompiler();

    expect(
      matchPlugin(
        compiler.options as Rspack.Configuration,
        'RsdoctorRspackPlugin',
      ),
    ).toBeTruthy();

    expect(
      logs.some((log) => log.includes('@rsdoctor') && log.includes('enabled')),
    ).toBe(false);

    process.env.RSDOCTOR = '';
    restore();
  },
);
