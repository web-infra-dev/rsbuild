export { createBuilder } from './createBuilder';
export { mergeBuilderConfig } from '@rsbuild/shared';

export type {
  BuilderMode,
  BuilderEntry,
  BuilderTarget,
  BuilderPlugin,
  BuilderContext,
  BuilderInstance,
  CreateBuilderOptions,
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
  ModifyBuilderConfigFn,
} from '@rsbuild/shared';
