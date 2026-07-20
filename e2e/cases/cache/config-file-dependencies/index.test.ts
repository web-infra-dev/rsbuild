import { realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, loadConfig } from '@rsbuild/core';

// `.mts` is intentional because Rspack cannot recursively detect its imports
// as build dependencies, so Rsbuild must add them explicitly.
test('should add config files to build dependencies', async () => {
  const { content } = await loadConfig({ cwd: import.meta.dirname });
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: content,
  });
  const [config] = await rsbuild.initConfigs();

  expect(config.cache).toMatchObject({
    buildDependencies: expect.arrayContaining([
      join(import.meta.dirname, 'rsbuild.config.mts'),
      await realpath(join(import.meta.dirname, 'shared.config.mts')),
    ]),
  });
});
