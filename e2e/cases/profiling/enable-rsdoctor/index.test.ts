import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, type Rspack } from '@rsbuild/core';
import { onTestFinished } from '@rstest/core';
import { RsdoctorRspackPlugin } from './_node_modules/@rsdoctor/rspack-plugin/index.js';

const getRsdoctorPlugins = (config: Pick<Rspack.Configuration, 'plugins'>) =>
  config.plugins?.filter(
    (plugin) => plugin?.constructor?.name === 'RsdoctorRspackPlugin',
  );

test.beforeEach(() => {
  process.env.RSDOCTOR = 'true';
});

test.afterEach(() => {
  delete process.env.RSDOCTOR;
});

for (const [core, expectedLog] of [
  ['current', '@rsdoctor/core enabled.'],
  ['missing', '@rsdoctor/rspack-plugin enabled.'],
  ['legacy', '@rsdoctor/rspack-plugin enabled.'],
] as const) {
  test(`should auto-load Rsdoctor with ${core} core and legacy plugin installed`, async ({
    logHelper,
  }) => {
    // Use separate paths to isolate package resolution and the ESM module cache.
    const cwd = await mkdtemp(join(tmpdir(), 'rsbuild-rsdoctor-'));
    onTestFinished(() => rm(cwd, { recursive: true, force: true }));
    const packagesPath = join(cwd, 'node_modules/@rsdoctor');
    await cp(join(import.meta.dirname, 'src'), join(cwd, 'src'), {
      recursive: true,
    });
    await cp(
      join(import.meta.dirname, '_node_modules/@rsdoctor'),
      packagesPath,
      {
        recursive: true,
      },
    );
    if (core === 'missing') {
      await rm(join(packagesPath, 'core'), { recursive: true });
    }
    if (core === 'legacy') {
      await writeFile(join(packagesPath, 'core/index.js'), 'export {};');
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
      expect(getRsdoctorPlugins(child.options)).toHaveLength(1);
    }
    await logHelper.expectLog(expectedLog);
  });
}

test('should preserve a manually registered Rsdoctor plugin', async ({
  copyNodeModules,
  logHelper,
}) => {
  await copyNodeModules();
  const plugin = new RsdoctorRspackPlugin();
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
