import { expect, test } from '@e2e/helper';
import { createRsbuild, type Rspack } from '@rsbuild/core';

test.afterEach(() => {
  delete process.env.RSDOCTOR;
});

test('should fall back to the legacy Rsdoctor package', async ({
  copyNodeModules,
  logHelper,
}) => {
  await copyNodeModules();
  process.env.RSDOCTOR = 'true';

  const rsbuild = await createRsbuild({ cwd: import.meta.dirname });
  const compiler = await rsbuild.createCompiler();
  const plugins = (compiler.options as Rspack.Configuration).plugins;

  expect(
    plugins?.filter(
      (plugin) => plugin?.constructor?.name === 'RsdoctorRspackPlugin',
    ),
  ).toHaveLength(1);
  await logHelper.expectLog('@rsdoctor/rspack-plugin enabled.');
});
