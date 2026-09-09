import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, type Rspack } from '@rsbuild/core';
import { onTestFinished } from '@rstest/core';

type RsdoctorExports = {
  RsdoctorRspackPlugin: new (
    options?: Record<string, unknown>,
  ) => Rspack.RspackPluginInstance;
};

const UPGRADE_LOG =
  'Please upgrade to Rsdoctor v2 by replacing @rsdoctor/rspack-plugin with @rsdoctor/core.';

const getRsdoctorPlugins = (config: Pick<Rspack.Configuration, 'plugins'>) =>
  config.plugins?.filter(
    (plugin) => plugin?.constructor?.name === 'RsdoctorRspackPlugin',
  );

test.beforeEach(async ({ copyNodeModules }) => {
  await copyNodeModules();
  process.env.RSDOCTOR = 'true';
});

test.afterEach(() => {
  delete process.env.RSDOCTOR;
});

for (const [core, legacy, expectedLog] of [
  ['current', false, '@rsdoctor/core enabled.'],
  ['current', true, '@rsdoctor/core enabled.'],
  ['missing', true, '@rsdoctor/rspack-plugin enabled.'],
  ['legacy', true, '@rsdoctor/rspack-plugin enabled.'],
  ['broken', true, 'failed to load @rsdoctor/core module.'],
  [
    'missing',
    false,
    'please install @rsdoctor/core or @rsdoctor/rspack-plugin package.',
  ],
] as const) {
  test(`should auto-load Rsdoctor with ${core} core and legacy plugin ${legacy ? 'installed' : 'missing'}`, async ({
    logHelper,
  }) => {
    // Use separate paths to isolate package resolution and the ESM module cache.
    const cwd = await mkdtemp(join(tmpdir(), 'rsbuild-rsdoctor-'));
    onTestFinished(() => rm(cwd, { recursive: true, force: true }));
    const packagesPath = join(cwd, 'node_modules/@rsdoctor');
    await cp(join(import.meta.dirname, 'src'), join(cwd, 'src'), {
      recursive: true,
    });
    for (const name of [
      core !== 'missing' && 'core',
      legacy && 'rspack-plugin',
    ]) {
      if (name) {
        await cp(
          join(import.meta.dirname, 'node_modules/@rsdoctor', name),
          join(packagesPath, name),
          { recursive: true },
        );
      }
    }
    if (core === 'legacy' || core === 'broken') {
      await writeFile(
        join(packagesPath, 'core/index.js'),
        core === 'legacy'
          ? 'export {};'
          : 'throw new Error("Broken Rsdoctor core fixture");',
      );
    }

    const rsbuild = await createRsbuild({
      cwd,
      config: {
        environments: { web: {}, node: { output: { target: 'node' } } },
      },
    });
    const compiler = (await rsbuild.createCompiler()) as Rspack.MultiCompiler;
    expect(compiler.compilers).toHaveLength(2);
    for (const child of compiler.compilers) {
      expect(getRsdoctorPlugins(child.options)).toHaveLength(
        expectedLog.endsWith('enabled.') ? 1 : 0,
      );
    }
    await logHelper.expectLog(expectedLog);
    logHelper.expectNoLog(UPGRADE_LOG);
  });
}

test('should not register Rsdoctor when disabled', async ({ logHelper }) => {
  process.env.RSDOCTOR = 'false';
  const rsbuild = await createRsbuild({ cwd: import.meta.dirname });
  const compiler = await rsbuild.createCompiler();
  expect(
    getRsdoctorPlugins(compiler.options as Rspack.Configuration),
  ).toHaveLength(0);
  logHelper.expectNoLog(/@rsdoctor\/.* enabled/);
  logHelper.expectNoLog(UPGRADE_LOG);
});

test('should preserve a manually registered Rsdoctor plugin', async ({
  logHelper,
}) => {
  const rsdoctorPackageName = '@rsdoctor/rspack-plugin';
  const { RsdoctorRspackPlugin } = (await import(
    rsdoctorPackageName
  )) as RsdoctorExports;
  const plugin = new RsdoctorRspackPlugin({ disableClientServer: true });
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: { tools: { rspack: { plugins: [plugin] } } },
  });
  const compiler = await rsbuild.createCompiler();
  expect(getRsdoctorPlugins(compiler.options as Rspack.Configuration)).toEqual([
    plugin,
  ]);
  logHelper.expectNoLog(/@rsdoctor\/.* enabled/);
});
