import { readFile, realpath, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, loadConfig } from '@rsbuild/core';

test('should preserve adapter metadata in context and build dependencies', async () => {
  const result = await loadConfig({ cwd: import.meta.dirname });
  const filePath = join(import.meta.dirname, 'app.config.mts');
  const dependencies = [
    await realpath(join(import.meta.dirname, 'shared.config.mts')),
    join(import.meta.dirname, 'rsbuild.config.ts'),
  ];

  expect(result.filePath).toBe(filePath);
  expect(result.dependencies).toEqual(dependencies);

  // Cover the CLI's LoadConfigResult input and frameworks forwarding content only.
  for (const config of [result, result.content]) {
    const rsbuild = await createRsbuild({ cwd: import.meta.dirname, config });
    expect(rsbuild.context.configFile).toBe(filePath);
    expect(rsbuild.context.configFileDependencies).toEqual(dependencies);

    const [bundlerConfig] = await rsbuild.initConfigs();
    expect(bundlerConfig.cache).toMatchObject({
      buildDependencies: expect.arrayContaining([filePath, ...dependencies]),
    });
  }
});

for (const file of ['app.config.mts', 'shared.config.mts']) {
  test(`should restart CLI builds when ${file} changes`, async ({
    execCli,
    logHelper,
  }) => {
    execCli('build --watch');
    await logHelper.expectBuildEnd();

    const filePath = join(import.meta.dirname, file);
    const content = await readFile(filePath, 'utf8');
    try {
      logHelper.clearLogs();
      await writeFile(filePath, `${content}\n// changed\n`);
      await logHelper.expectLog(`restarting build as ${file} changed`);
      await logHelper.expectBuildEnd();
    } finally {
      await writeFile(filePath, content);
    }
  });
}
