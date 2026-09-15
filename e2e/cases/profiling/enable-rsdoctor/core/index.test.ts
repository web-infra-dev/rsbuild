import { expect, test } from '@e2e/helper';
import { createRsbuild, type Rspack } from '@rsbuild/core';
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

test('should prefer Rsdoctor core', async ({ copyNodeModules, logHelper }) => {
  await copyNodeModules();
  const rsbuild = await createRsbuild({ cwd: import.meta.dirname });
  const compiler = await rsbuild.createCompiler();

  expect(
    getRsdoctorPlugins(compiler.options as Rspack.Configuration),
  ).toHaveLength(1);
  await logHelper.expectLog('@rsdoctor/core enabled.');
});

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
