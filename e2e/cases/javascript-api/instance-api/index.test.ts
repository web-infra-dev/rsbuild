import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';

rspackOnlyTest(
  'should allow to call `modifyRsbuildConfig` via Rsbuild instance',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });
    rsbuild.modifyRsbuildConfig((config) => {
      config.mode = 'none';
    });

    const result = await rsbuild.inspectConfig();
    expect(result.origin.rsbuildConfig.mode).toBe('none');
  },
);

rspackOnlyTest(
  'should allow to call `modifyEnvironmentConfig` via Rsbuild instance',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });
    rsbuild.modifyRsbuildConfig((config) => {
      config.mode = 'development';
    });
    rsbuild.modifyEnvironmentConfig((config) => {
      config.mode = 'none';
    });

    const result = await rsbuild.inspectConfig();
    expect(result.origin.rsbuildConfig.mode).toBe('development');
    expect(result.origin.environmentConfigs.web.mode).toBe('none');
  },
);
