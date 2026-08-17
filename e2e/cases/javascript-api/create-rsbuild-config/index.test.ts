import { expect, test } from '@e2e/helper';
import { createRsbuild, loadConfig } from '@rsbuild/core';

test('should accept loadConfig result as config input', async () => {
  const result = await loadConfig({ cwd: import.meta.dirname });
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: result,
  });

  expect(rsbuild.context.configFile).toBe(result.filePath);
  expect(rsbuild.context.configFileDependencies).toEqual(result.dependencies);
});
