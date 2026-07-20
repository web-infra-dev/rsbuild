import { realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, loadConfig } from '@rsbuild/core';

test('should expose config files through context', async () => {
  const { content } = await loadConfig({ cwd: import.meta.dirname });
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: content,
  });

  expect(rsbuild.context.configFile).toBe(join(import.meta.dirname, 'rsbuild.config.mjs'));
  expect(rsbuild.context.configFileDependencies).toEqual([
    await realpath(join(import.meta.dirname, 'shared.config.mjs')),
  ]);
});
