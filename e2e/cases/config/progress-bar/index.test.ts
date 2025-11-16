import { expect, rspackTest } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';

rspackTest('should enable progress plugin when dev.progressBar is set', async () => {
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      dev: {
        progressBar: {
          id: 'custom-progress',
        },
      },
    },
  });

  const { bundlerConfigs } = await rsbuild.inspectConfig({ verbose: true });

  expect(
    bundlerConfigs.some(
      (config) =>
        config.includes('ProgressPlugin') && config.includes('custom-progress'),
    ),
  ).toBeTruthy();
});
