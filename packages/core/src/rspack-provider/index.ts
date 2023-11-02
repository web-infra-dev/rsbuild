export { getRspackVersion } from './shared/rspackVersion';
export { rspackProvider } from './provider';
export type { RspackProvider } from './provider';

export type {
  // Config Types
  RsbuildConfig,
  NormalizedConfig,

  // Hook Callback Types
  ModifyRspackConfigFn,

  // Plugin Types
  RsbuildPluginAPI,
} from './types';

export type { Rspack, RspackConfig } from '@rsbuild/shared';
