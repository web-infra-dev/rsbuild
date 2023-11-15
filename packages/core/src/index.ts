export { createRsbuild, getCreateRsbuildDefaultOptions } from './createRsbuild';
export { mergeRsbuildConfig } from '@rsbuild/shared';

export { defineConfig } from './cli';

export type {
  Rspack,
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildPluginAPI,
} from './rspack-provider';

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
