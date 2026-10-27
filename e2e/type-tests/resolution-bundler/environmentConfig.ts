import {
  mergeRsbuildConfig,
  type MergedEnvironmentConfig,
  type RsbuildConfig,
} from '@rsbuild/core';

// Plugins can pass merged environment configs back into the config merger.
export const mergeEnvironmentConfig = (config: MergedEnvironmentConfig) =>
  mergeRsbuildConfig<RsbuildConfig>(config, {
    server: { publicDir: false },
  });
