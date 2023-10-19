export { createRsbuild } from './createRsbuild';
export { mergeRsbuildConfig } from '@rsbuild/shared';

export { defineConfig } from './cli';

export type { RsbuildPluginAPI, RsbuildConfig } from './rspack-provider';
export type {
  RsbuildMode,
  RsbuildEntry,
  RsbuildTarget,
  RsbuildPlugin,
  Context,
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
