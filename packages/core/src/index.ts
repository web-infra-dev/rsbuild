export { createRsbuild, getCreateRsbuildDefaultOptions } from './createRsbuild';
export { mergeRsbuildConfig } from '@rsbuild/shared';

export { defineConfig } from './cli';

export type { Rspack } from './rspack-provider';

export type {
  // Config Types
  RsbuildConfig,
  NormalizedConfig,
  // Plugin Types
  RsbuildPlugin,
  RsbuildPluginAPI,
} from './types';

export type {
  Context,
  RsbuildMode,
  RsbuildEntry,
  RsbuildTarget,
  RsbuildInstance,
  CreateRsbuildOptions,
  InspectConfigOptions,

  // Hook Callback Types
  OnExitFn,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnBeforeBuildFn,
  OnBeforeStartDevServerFn,
  OnBeforeCreateCompilerFn,
  OnDevCompileDoneFn,
  ModifyRsbuildConfigFn,
} from '@rsbuild/shared';
