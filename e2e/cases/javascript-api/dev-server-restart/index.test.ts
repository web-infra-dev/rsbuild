import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, loadConfig, type RestartContext } from '@rsbuild/core';
import { getRandomPort } from '@rstackjs/test-utils';

const configDep = path.join(import.meta.dirname, 'test-temp-config-dep.mjs');
const configDepContent = 'export const sharedConfig = {};\n';

test.beforeAll(() => {
  fs.writeFileSync(configDep, configDepContent);
});

test.afterAll(() => {
  fs.rmSync(configDep, { force: true });
});

test('should watch loaded config dependencies for restart', async () => {
  const result = await loadConfig({ cwd: import.meta.dirname });

  result.content.server = {
    port: await getRandomPort(),
  };

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
      .poll(() => {
        if (!restartContext) {
          fs.writeFileSync(configDep, `${configDepContent}// ${++version}\n`);
        }
        return restartContext;
      })
      .toEqual({
        action: 'dev',
        filePath: configDep,
        options: {},
      });
  } finally {
    await server.close();
  }
});
