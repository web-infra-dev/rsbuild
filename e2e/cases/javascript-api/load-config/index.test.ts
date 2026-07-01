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
