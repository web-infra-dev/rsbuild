import { expect, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { createRsbuild, type Rspack } from '@rsbuild/core';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { matchPlugin } from '@scripts/test-helper';

const RSDOCTOR_LOG = '@rsdoctor/rspack-plugin enabled';

rspackOnlyTest(
  'should register Rsdoctor plugin when process.env.RSDOCTOR is true',
  async () => {
    const { expectLog, restore } = proxyConsole();
    process.env.RSDOCTOR = 'true';

    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });

    const compiler = await rsbuild.createCompiler();

    await expectLog(RSDOCTOR_LOG);

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
    const { expectNoLog, restore } = proxyConsole();
    process.env.RSDOCTOR = 'false';

    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });

    const compiler = await rsbuild.createCompiler();

    expectNoLog(RSDOCTOR_LOG);

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
    const { expectNoLog, restore } = proxyConsole();

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

    expectNoLog(RSDOCTOR_LOG);

    process.env.RSDOCTOR = '';
    restore();
  },
);
