import { expect, rspackTest } from '@e2e/helper';
import { createRsbuild, type Rspack } from '@rsbuild/core';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { matchPlugin } from '@scripts/test-helper';

const RSDOCTOR_LOG = '@rsdoctor/rspack-plugin enabled';

rspackTest(
  'should register Rsdoctor plugin when process.env.RSDOCTOR is true',
  async ({ logHelper }) => {
    const { expectLog } = logHelper;
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

    process.env.RSDOCTOR = '';
  },
);

rspackTest(
  'should not register Rsdoctor plugin when process.env.RSDOCTOR is false',
  async ({ logHelper }) => {
    const { expectNoLog } = logHelper;
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
  },
);

rspackTest(
  'should not register Rsdoctor plugin when process.env.RSDOCTOR is true and the plugin has been registered',
  async ({ logHelper }) => {
    const { expectNoLog } = logHelper;

    process.env.RSDOCTOR = 'true';

    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
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
  },
);
