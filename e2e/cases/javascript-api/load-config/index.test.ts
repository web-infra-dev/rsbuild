import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { loadConfig } from '@rsbuild/core';

test('should pass command to config function', async () => {
  const { content } = await loadConfig({
    cwd: import.meta.dirname,
    command: 'build',
  });

  expect(content.source?.define).toEqual({
    COMMAND: JSON.stringify('build'),
  });
});

test('should load config from custom config file names', async () => {
  const { content, filePath } = await loadConfig({
    cwd: import.meta.dirname,
    configFileNames: ['custom.config.mjs', 'fallback.config.mjs'],
  });

  expect(filePath).toBe(join(import.meta.dirname, 'custom.config.mjs'));
  expect(content.source?.define).toEqual({
    CONFIG_FILE_NAME: JSON.stringify('custom'),
  });
});
