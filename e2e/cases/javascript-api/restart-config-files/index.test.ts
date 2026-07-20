import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, loadConfig, type RestartContext } from '@rsbuild/core';
import { getRandomPort } from '@rstackjs/test-utils';

const configDependency = path.join(import.meta.dirname, 'sharedConfig.mjs');
const originalConfig = fs.readFileSync(configDependency, 'utf-8');

test.afterAll(() => {
  fs.writeFileSync(configDependency, originalConfig);
});

test('should watch loaded config dependencies for restart', async () => {
  const result = await loadConfig({ cwd: import.meta.dirname });
  result.content.server = { port: await getRandomPort() };

  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: result,
  });
  let restartContext: RestartContext | undefined;
  rsbuild.onRestart((context) => {
    restartContext = context;
  });

  const server = await rsbuild.createDevServer({ runCompile: false });
  let version = 0;

  try {
    await expect
      .poll(
        () => {
          if (!restartContext) {
            fs.writeFileSync(configDependency, `${originalConfig}\n// ${++version}\n`);
          }
          return restartContext;
        },
        { timeout: 5_000 },
      )
      .toEqual({
        action: 'dev',
        filePath: configDependency,
      });
  } finally {
    await server.close();
  }
});
